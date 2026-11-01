import { calculateValue } from "./StackingEngine.js";

export class Effect {
    constructor(id, action, target, trigger, baseValue, stackingRule, incrementStack, metric, bus) {
        this.id = id;
        this.action = action;
        this.target = target; 
        this.trigger = trigger;
        this.baseValue = baseValue;
        this.incrementStack = incrementStack;
        this.stackingRule = stackingRule;
        this.stacks = 1;
        this.metric = metric;
        this.bus = bus;

        bus.on(this.trigger, (payload) => {
            // Передаем и сам эффект, и данные, которые пришли из события
            this.bus.emit(this.action, { effect: this, payload: payload }); 
        });
    }

    addStack() {
        this.stacks++;
    }

    getValue() {
        return calculateValue(this.baseValue, this.stacks, this.incrementStack, this.stackingRule);
    }
}