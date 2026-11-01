export class Hero {
    constructor(health, damage, attackSpeed, bus) {
        this.health = health;
        this.damage = damage;
        this.attackSpeed = attackSpeed; // 1 - 8
        this.id = crypto.randomUUID();
        this.isAlive = true;
        this.bus = bus;
        this.nextAttackTime = 0;
    }

    attack(enemy) {

        if (!this.isAlive) return;
        
        if (!enemy.isAlive)  return; 

        const now = Date.now(); // Получаем текущее время в миллисекундах
        if (now < this.nextAttackTime) return;

        enemy.takeHeroAttack(this.calculateDamage());
        this.bus.emit("attackByHero", { heroId: this.id, enemyId: enemy.id });
        this.nextAttackTime = Date.now() + (1000 / this.calculateAttackSpeed()); // Устанавливаем время следующей атаки
    }

    calculateDamage() {
        return this.damage;
    }

    calculateAttackSpeed() {
        if (this.attackSpeed < 1 ) this.attackSpeed = 1;

        if (this.attackSpeed > 8) this.attackSpeed = 8;
        
        return this.attackSpeed * 0.5; // атак в секунду, 1 = 0.5 атак в секунду, 8 = 4 атак в секунду
    }

    die() {
        if (!this.isAlive) return;

        if (this.health <= 0) {
            this.isAlive = false;
            this.health = 0;
            this.bus.emit("heroDied", { heroId: this.id });
        }        
    }
}