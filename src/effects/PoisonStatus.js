import { StatusEffect } from "../core/StatusEffect.js";

export class PoisonStatus extends StatusEffect {
    constructor(id, target, duration, damagePerSecond) {
        super(id, target, duration);
        this.damagePerSecond = damagePerSecond;
    }

    tick(deltaTime, target = this.target) {     
        super.tick(deltaTime, target);
        
        if (!this.isExpired && target.isAlive) {
            const rawDamage = this.damagePerSecond * (deltaTime / 1000); 
        
            // Считаем, сколько урона можно нанести, чтобы осталось хотя бы 1 хп
            const safeDamage = Math.min(rawDamage, target.health - 1);
            
            // Если safeDamage больше 0, наносим его (событие сработает, но враг не умрет)
            if (safeDamage > 0) {
                target.takeDamage(safeDamage);
            }
        }
    }
}