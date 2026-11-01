import { EventBus } from "../core/EventBus.js";

export class Enemy {
    constructor(health, damage, bus) {
        this.health = health;
        this.damage = damage;
        this.id = crypto.randomUUID();
        this.isAlive = true;
        this.bus = bus;
        this.statuses = [];
    }

    takeDamage(amount) {
        if (!this.isAlive) return;

        this.bus.emit("enemyTakeDamage", { enemyId: this.id, amount: amount });

        this.health -= amount;
        if (this.health <= 0) {
            this.isAlive = false;
            this.health = 0;
            this.bus.emit("enemyDied", { enemyId: this.id });
        }
    }

    takeHeroAttack(amount) {
        this.bus.emit("attackedByHero", { enemyId: this.id });
        this.takeDamage(amount);
    }

    addStatus(status) {
        if (this.statuses.some(s => s.id === status.id)) {
            this.statuses.forEach(s => {
                if (s.id === status.id) {
                    s.timeLeft = status.duration; 
                }
            });
            return;
        }
        this.statuses.push(status);
    }

    deleteStatus(statusId) {
        this.statuses = this.statuses.filter(s => s.id !== statusId);
    }

}