describe('LearnJS', function () {
    it('can show a problem view', function () {
        learnjs.showView('#problem-1');
        expect($('.view-container .problem-view').length).toEqual(1);
    });
    it('shows the landing page view when there is no hash', function () {
        learnjs.showView('');
        expect($('.view-container .landing-view').length).toEqual(1);
    });
    it('passes the hash view parameter to the view function', function () {
        spyOn(learnjs, 'problemView'); // spyしたい関数名とそれを含むオブジェクトを渡す
        learnjs.showView('#problem-42');
        expect(learnjs.problemView).toHaveBeenCalledWith('42');
    });
    it('invokes the router when loaded', function () {
        spyOn(learnjs, 'showView');
        learnjs.appOnReady();
        expect(learnjs.showView).toHaveBeenCalledWith(window.location.hash);
    });
    it('subscribes to the hash change event', function () {
        learnjs.appOnReady();
        spyOn(learnjs, 'showView');
        $(window).trigger('hashchange')
        expect(learnjs.showView).toHaveBeenCalledWith(window.location.hash)
    })
    it('can flash an element while setting the text', function() {
        const elem = $('<p>');
        spyOn(elem, 'fadeOut').and.callThrough();
        spyOn(elem, 'fadeIn');
        learnjs.flashElement(elem, "new text");
        expect(elem.text()).toEqual("new text");
        expect(elem.fadeOut).toHaveBeenCalled();
        expect(elem.fadeIn).toHaveBeenCalled();
    })
    it('can redirect to the main view after the last problem is answered', function() {
        const flash = learnjs.buildCorrectFlash(2);
        expect(flash.find('a').text()).toEqual("You're Finished!");
        expect(flash.find('a').attr('href')).toEqual('');

    })

    it('can trigger events on the view', function() {
        callback = jasmine.createSpy('callback');
        const div = $('<div>').bind('fooEvent', callback);
        $('.view-container').append(div);
        learnjs.triggerEvent('fooEvent', ['bar']);
        expect(callback).toHaveBeenCalled();
        expect(callback.calls.argsFor(0)[1]).toEqual('bar');
    });

    describe('awsRefresh', function () {
        let callbackArg, fakeCreds;

        beforeEach(function() {
            fakeCreds = jasmine.createSpyObj('creds', ['refresh']);
            fakeCreds.identityId = 'COGNITO_ID';
            AWS.config.credentials = fakeCreds;
            fakeCreds.refresh.and.callFake(function(cb) { cb(callbackArg); });
        });

        it('returns a promise that resolves on success', function (done) {
            learnjs.awsRefresh().then(function (id) {
                expect(fakeCreds.identityId).toEqual('COGNITO_ID');
            }).then(done, fail);
        });

        it('reject the promise on failure', function (done) {
            callbackArg = 'error';
            learnjs.awsRefresh().fail(function (err) {
                expect(err).toEqual('error');
                done();
            });
        });
    });


    describe('profile view', function() {
        var view;
        beforeEach(function() {
            view = learnjs.profileView();
        });

        it('shows the users email address when they log in', function() {
            learnjs.identity.resolve({
                email: 'foo@bar.com'
            });
            expect(view.find('.email').text()).toEqual("foo@bar.com");
        });

        it('shows no email when the user is not logged in yet', function() {
            expect(view.find('.email').text()).toEqual("");
        });
    });


    // describe('googleSignIn callback', function() {
    //
    //     it('sets the AWS region', function() {
    //         expect(AWS.config.region).toEqual('us-east-1');
    //     });
    // })

    describe('problem view', function () {
        let view;
        beforeEach(function () {
            view = learnjs.problemView('1')
        });

        it('has a title that includes the problem number', function () {
            expect(view.find('.title').text()).toEqual('Problem #1');
        })
        it('shows the description', function () {
            expect(view.find('[data-name="description"]').text()).toEqual('What is truth?');
        })
        it('shows the problem code', function () {
            expect(view.find('[data-name="code"]').text()).toEqual('function problem() { return __; }');
        })

        describe('answer section', function () {
            let resultFlash;

            beforeEach(function () {
                spyOn(learnjs, 'flashElement');
                resultFlash = view.find('.result');
            });

            describe('when the answer is correct', function () {
                beforeEach(function() {
                    view.find('.answer').val('true');
                    view.find('.check-btn').click();
                });

                it('flashes the result', function() {
                  const flashArgs = learnjs.flashElement.calls.argsFor(0);
                  expect(flashArgs[0]).toEqual(resultFlash);
                  expect(flashArgs[1].find('span').text()).toEqual('Correct!');
                })

                it('shows a link to the next problem', function() {
                    const link = learnjs.flashElement.calls.argsFor(0)[1].find('a');
                    expect(link.text()).toEqual('Next Problem');
                    expect(link.attr('href')).toEqual('#problem-2');
                })
            })

            it('reject an incorrect answer', function () {
                view.find('.answer').val('false');
                view.find('.check-btn').click();
                expect(learnjs.flashElement).toHaveBeenCalledWith(resultFlash, 'Incorrect!');
            })
        })

    })
});