'use strict';

const learnjs = {
    poolId: 'us-east-1:6253fe66-83e2-4371-a622-759ca48e7f9b'
};

learnjs.identity = new $.Deferred();

learnjs.problems = [
    {
        description: "What is truth?",
        code: "function problem() { return __; }"
    },
    {
        description: "Simple Math",
        code: "function problem() { return 42 === 6 * __; }"
    }
];

learnjs.triggerEvent = function(name, args) {
    $('.view-container>*').trigger(name, args);
}

learnjs.template = function(name) {
    return $('.templates .' + name).clone();
}

learnjs.applyObject = function(obj, elem) {
    for (const key in obj) {
        elem.find('[data-name="' + key + '"]').text(obj[key]);
    }
};

learnjs.addProfileLink = function(profile) {
    const link = learnjs.template('profile-link');
    link.find('a').text(profile.email);
    $('.signin-bar').prepend(link);
}

learnjs.flashElement = function(elem, content) {
    elem.fadeOut('fast', function() {
        elem.html(content);
        elem.fadeIn();
    });
}

learnjs.buildCorrectFlash = function (problemNum) {
    const correctFlash = learnjs.template('correct-flash');
    const link = correctFlash.find('a');
    if (problemNum < learnjs.problems.length) {
        link.attr('href', '#problem-' + (problemNum + 1));
    } else {
        link.attr('href', '');
        link.text("You're Finished!");
    }
    return correctFlash;
}

learnjs.problemView = function(data) {
    const problemNumber = parseInt(data, 10);
    const view = learnjs.template('problem-view');
    const problemData = learnjs.problems[problemNumber - 1];
    const resultFlash = view.find('.result');
    let answer;

    learnjs.fetchAnswer(problemNumber).then(function (data) {
        answer.val(data.Item.answer);
    })

    function checkAnswer() {
        const test = problemData.code.replace('__', answer) + '; problem();';
        return eval(test);
    }

    function checkAnswerClick() {
        answer = view.find('.answer').val();
        if (checkAnswer()) {
            const flashContent = learnjs.buildCorrectFlash(problemNumber);
            learnjs.flashElement(resultFlash, flashContent);
            learnjs.saveAnswer(problemNumber, answer);
        } else {
            learnjs.flashElement(resultFlash, 'Incorrect!');
        }
        return false;
    }

    if (problemNumber < learnjs.problems.length) {
        const buttonItem = learnjs.template('skip-btn');
        buttonItem.find('a').attr('href', '#problem-' + (problemNumber + 1));
        $('.nav-list').append(buttonItem);
        view.bind('removingView', function() {
            buttonItem.remove();
        });
    }

    view.find('.check-btn').click(checkAnswerClick);
    view.find('.title').text('Problem #' + problemNumber);
    learnjs.applyObject(problemData, view);
    return view;
}

learnjs.landingView = function() {
    return learnjs.template('landing-view');
}

learnjs.profileView = function() {
    const view = learnjs.template('profile-view');
    learnjs.identity.done(function(identity) {
        view.find('.email').text(identity.email);
    });
    return view;
}

learnjs.showView = function(hash) {
    const routes = {
        '#problem': learnjs.problemView,
        '#profile': learnjs.profileView,
        '#': learnjs.landingView,
        '': learnjs.landingView
    };
    const hashParts = hash.split('-');
    const viewFn = routes[hashParts[0]];
    if (viewFn) {
        learnjs.triggerEvent('removingView', []);
        $('.view-container').empty().append(viewFn(hashParts[1]));
    }
}

learnjs.appOnReady = function() {
    window.onhashchange = function() {
        learnjs.showView(window.location.hash);
    };
    learnjs.showView(window.location.hash);
    learnjs.identity.done(learnjs.addProfileLink);
}

learnjs.awsRefresh = function() {
    const deferred = new $.Deferred();
    AWS.config.credentials.refresh(function(err) {
        if (err) {
            deferred.reject(err);
        } else {
            deferred.resolve(AWS.config.credentials.identityId);
        }
    });
    return deferred.promise();
}

learnjs.parseJWT = function (googleUser) {
    const credential = googleUser.credential;
    const encodedClaims = credential.split('.')[1];
    const payload = JSON.parse(
        decodeURIComponent(
            escape(
                atob(encodedClaims
                    .replace(/-/g, '+')
                    .replace(/_/g, '/')))
        )
    );
return payload;
    //return new learnjs.profile(payload.sub, payload.email);
};

learnjs.profile = function (id,email) {
    this.id = id;
    this.email = email;
}

learnjs.sendDbRequest = function (req, retry) {
    const promise = new $.Deferred;
    req.on('error', function (error) {
        if(error.code === "CredentialsError") {
            learnjs.identity.then(function (identity) {
                return identity.refresh.then(function () {
                    return retry();
                }, function () {
                    promise.reject(resp);
                })
            })
        } else {
            promise.reject(error);
        }
    });
    req.on('success', function (resp) {
        promise.resolve(resp.data);
    });
    req.send();
    return promise;
}

learnjs.fetchAnswer = function (problemId) {
    return learnjs.identity.then(function (identity) {
        const db = new AWS.DynamoDB.DocumentClient();
        const item = {
            TableName: 'learnjs',
            Key: {
                userId: identity.id,
                problemId: problemId
            }
        };
        return learnjs.sendDbRequest(db.get(item), function () {
            return learnjs.fetchAnswer(problemId);
        });
    });
}

learnjs.saveAnswer = function (problemId, answer) {
    // identityが解決されるまで待つ
    return learnjs.identity.then(function (identity) {
        const db = new AWS.DynamoDB.DocumentClient();
        const item = {
            TableName: 'learnjs',
            Item: {
                userId: identity.id,
                problemId: problemId,
                answer: answer
            }
        };
        return learnjs.sendDbRequest(db.put(item), function () {
            return learnjs.saveAnswer(problemId, answer);
        });
    });
}


function googleSignIn(googleUser) {
    const id_token = learnjs.parseJWT(googleUser);

    AWS.config.update({
        region: 'us-east-1',
        credentials: new AWS.CognitoIdentityCredentials({
            IdentityPoolId: learnjs.poolId,
            Logins: {
                'accounts.google.com': id_token
            }
        })
    })
    function refresh() {
        return gapi.auth2.getAuthInstance().signIn({
            prompt: 'login'
        }).then(function(userUpdate) {
            const creds = AWS.config.credentials;
            const newTokenData = learnjs.parseJWT(userUpdate);
            creds.params.Logins['accounts.google.com'] = newTokenData.id;
            return learnjs.awsRefresh();
        });
    }
    learnjs.awsRefresh().then(function(id) {
        const email = learnjs.parseJWT(googleUser).email;
        learnjs.identity.resolve({
            id: id,
            email: email,
            refresh: refresh
        });
    });
}
