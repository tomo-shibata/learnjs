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

learnjs.problemView = function (data) {
    const problemNumber = parseInt(data, 10);
    const view = $('.templates .problem-view').clone();
    view.find('.title').text('Problem #' + problemNumber);
    learnjs.applyObject(learnjs.problems[problemNumber - 1],view);
    return view;
}

learnjs.showView = function (hash) {
    const routes = {
        '#problem': learnjs.problemView
    };
    const hashParts = hash.split('-');
    const viewFn = routes[hashParts[0]];
    if (viewFn) {
        $('.view-container').empty().append(viewFn(hashParts[1]));
    }
}

learnjs.appOnReady = function () {
    window.onhashchange = function () {
        learnjs.showView(window.location.hash);
    };
    learnjs.showView(window.location.hash);
}

learnjs.applyObject = function (obj, elm) {
    for (const key in obj) {
        elm.find('[data-name="' + key + '"]').text(obj[key]);
    }
}