import { Hero } from "./entities/Hero.js";
import { EventBus } from "./core/EventBus.js";
import { Effect } from "./core/Effect.js";
import { Enemy } from "./entities/Enemy.js";
import { BurnStatus } from "./effects/BurnStatus.js";

const bus = new EventBus();

const shards = new Effect(
    "shards",
    "SPAWN_SHARDS",
    "ENEMY",
    "enemyDied",
    3,
    "ADD",
    1,
    "COUNT",
    bus
);

shards.addStack(); // Добавляем стак, чтобы эффект сработал на 4 осколка

const burnEffect = new Effect(
    "burn",
    "APPLY_BURN",
    "ENEMY",
    "attackedByHero", // Слушаем ПОПАДАНИЕ героя
    3,        // Базовая длительность 3 секунды
    "ADD",
    1,        // +1 секунда за стак
    "DURATION",
    bus
);

burnEffect.addStack(); // Добавляем стак, чтобы эффект сработал на 4 секунды

bus.on("APPLY_BURN", (data) => {
    // Достаем ID врага из вложенного payload
    const enemyId = data.payload.enemyId; 
    
    // Находим этого врага в массиве
    const target = enemies.find(e => e.id === enemyId);
    
    if (target && target.isAlive) {
        const effect = data.effect; // Сам эффект (для getValue)
        const duration = effect.getValue(); 
        
        // BurnStatus в конструкторе сам вызовет target.addStatus(this)
        target.addStatus(new BurnStatus("fire", target, duration, 5));
    }
});


bus.on("SPAWN_SHARDS", (data) => {
    const shardDamage = hero.calculateDamage() * 0.2; 
    
    for (let i = 0; i < data.effect.getValue(); i++) {
        const aliveEnemies = enemies.filter(e => e.isAlive); 
        if (aliveEnemies.length === 0) break; // Если убили всех — оставшиеся осколки летят в молоко

        // Выбираем случайного из живых
        const randomIndex = Math.floor(Math.random() * aliveEnemies.length);
        const currentTarget = aliveEnemies[randomIndex];
        
        currentTarget.takeHeroAttack(shardDamage);
    }
});

const hero = new Hero(100, 10, 2, bus);

const enemies = [
    new Enemy(20, 5, bus),
    new Enemy(30, 6, bus),
    new Enemy(50, 7, bus),
    new Enemy(25, 7, bus),
    new Enemy(35, 7, bus),
    new Enemy(45, 7, bus),
    new Enemy(45, 7, bus),  
    new Enemy(54, 7, bus)

];


// Твой игровой цикл
const gameLoop = setInterval(() => {

    // 1. Берем первого живого врага
    const currentEnemy = enemies.find(e => e.isAlive);

    enemies.forEach(enemy => {
        if (enemy.statuses.length > 0) {
            enemy.statuses.forEach(status => {
                if (!status.isExpired) {
                    status.tick(100, enemy); // Передаем deltaTime в миллисекундах и цель
                }
            });
            enemy.statuses = enemy.statuses.filter(status => !status.isExpired);
        }

    })
    
    if (currentEnemy) {
        // Герой пытается атаковать
        hero.attack(currentEnemy);
        
        // Выводим хп врага для наглядности
        console.log(`Враг: HP ${currentEnemy.health}, ${currentEnemy.isAlive ? "Alive" : "Dead"} id: ${currentEnemy.id} `);
    } else {
        // Если живых врагов нет — останавливаем игру
        console.log("Все враги мертвы! Победа!");
        clearInterval(gameLoop);
    }
}, 100); // тик каждые 100 мс




