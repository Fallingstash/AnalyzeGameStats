export function calculateValue(baseValue, stacks, incrementStack, rule) {
    if (stacks === 0) return 0;

    switch (rule) {
        case "ADD":
            return baseValue + (stacks - 1) * incrementStack;
        case "MULTIPLY":
            return baseValue * stacks;
        case "MAX":
            return Math.min(baseValue + (stacks - 1) * incrementStack, 80);
        default:
            return 0;
    }
}