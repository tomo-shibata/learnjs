describe('lambda function', function () {
    let index = require('index');
    let context;

    beforeEach(function () {
        context = jasmine.createSpyObj('context', ['succeed']);
        index.dynamodb = jasmine.createSpyObj('dynamo', ['scan']);
    });

    describe('popularAnswers', function () {
        it('request problems with the given problem number', function () {
            index.popularAnswers({problemNumber: 42}, context);
            expect(index.dynamodb.scan).toHaveBeenCalledWith({
                FilterExpression: 'problemId = :problemId',
                ExpressionAttributeValues: {'problemId': 42},
                TableName: 'learnjs',
            }, jasmine.any(Function));
        });

        it('groups answers by minified code', function () {
            index.popularAnswers({problemNumber: 1}, context);
            index.dynamodb.scan.calls.first().args[1](undefined, {Items: [
                    {answer: "true"},
                    {answer: "true"},
                    {answer: "true"},
                    {answer: "!false"},
                    {answer: "!false"}
                ]});
            expect(context.succeed).toHaveBeenCalledWith({"true": 3, "!false": 2});
        });
    });
});
