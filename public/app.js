'use strict';

const learnjs = {};

learnjs.problems = [
    {
        description: "What is truth?",
        code: "function problem() { return __; }"
    },
    {
        description: "Simple Math",
        code: "function problem() { return 42 === 6 * __; }"
    }
]

learnjs.triggerEvent = function(name, args) {
    $('.view-container>*').trigger(name, args);
}
learnjs.template = function(name) {
    return $('.templates .' + name).clone();
}
learnjs.applyObject = function (obj, elm) {
    for (const key in obj) {
        elm.find('[data-name="' + key + '"]').text(obj[key]);
    }
}

learnjs.flashElement = function (elem, content) {
    elem.fadeOut('fast', function () {
        elem.html(content);
        elem.fadeIn();
    });

}

learnjs.buildCorrectFlash = function (problemNum) {
    const correctFlash = learnjs.template('correct-flash');
    const link = correctFlash.find('a');
    if(problemNum < learnjs.problems.length) {
        link.attr('href', '#problem-' + (problemNum + 1));
    } else {
        link.attr('href', '');
        link.text("You're Finished!");
    }
    return correctFlash;

}

learnjs.problemView = function (data) {
    const problemNumber = parseInt(data, 10);
    const view = learnjs.template('problem-view');
    const problemData = learnjs.problems[problemNumber - 1];
    const resultFlash = view.find('.result');

    function checkAnswer() {
        const answer = view.find('.answer').val();
        const test = problemData.code.replace('__', answer) + '; problem();';
        return eval(test);
    }
    function checkAnswerClick() {
        if (checkAnswer()) {
            const flashContent = learnjs.buildCorrectFlash(problemNumber);
            learnjs.flashElement(resultFlash, flashContent);
        } else {
            learnjs.flashElement(resultFlash, 'Incorrect!');
        }
        return false;
    }

    if( problemNumber < learnjs.problems.length) {
        const buttonItem = learnjs.template('skip-btn');
        buttonItem.find('a').attr('href', '#problem-' +(problemNumber + 1));
        $('.nav-list').append(buttonItem);
        view.bind('removingView', function () {
           buttonItem.remove();
        });
    }

    view.find('.check-btn').click(checkAnswerClick);
    view.find('.title').text('Problem #' + problemNumber);
    learnjs.applyObject(problemData, view);
    return view;
}

learnjs.landingView = function () {
    return learnjs.template('landing-view');
}

learnjs.showView = function (hash) {
    const routes = {
        '#problem': learnjs.problemView,
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

learnjs.appOnReady = function () {
    window.onhashchange = function () {
        learnjs.showView(window.location.hash);
    };
    learnjs.showView(window.location.hash);
}
