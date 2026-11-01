import { StatusEffect } from "../core/StatusEffect.js";

export class BurnStatus extends StatusEffect {
    constructor(id, target, duration, damagePerSecond) {
        super(id, target, duration);
        this.damagePerSecond = damagePerSecond;

    }

    tick(deltaTime, target = this.target) {
        super.tick(deltaTime, target);
        
        if (!this.isExpired && target.isAlive) {
            const damage = this.damagePerSecond * (deltaTime / 1000); // Преобразуем deltaTime из миллисекунд в секунды
            target.takeDamage(damage);
        }
    }
}