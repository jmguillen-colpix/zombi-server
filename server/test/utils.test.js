// process._rawDebug = jest.fn();

const utils = require("../app/utils");

describe('Testing utilities', () => {

    test("should return empty elements", () => {
        const elements = [
            "",
            {},
            [],
            "E23f"
        ];

        for (const element of elements) {
            expect(utils.is_empty(element));
        }

    });

});