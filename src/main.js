import { Hero } from "./entities/Hero.js";
import { EventBus } from "./core/EventBus.js";
import { Effect } from "./core/Effect.js";
import { Enemy } from "./entities/Enemy.js";
import { BurnStatus } from "./effects/BurnStatus.js";

function tick(hero, enemies, currentTime) {
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

    const currentEnemy = enemies.find(e => e.isAlive);

    if (currentEnemy) {
        // Герой пытается атаковать
        hero.attack(currentEnemy, currentTime);
        
    }

}

function runSimulation(shardsStacks, burnStacks) {
    const bus = new EventBus();
    const hero = new Hero(100, 10, 2, bus);

    const enemies = [];
    for(let i = 0; i < 8; i++) {
        enemies.push(new Enemy(30 + i * 5, 5, bus)); // Чуть разнообразнее хп
    }

    if (shardsStacks > 0) {
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
        for(let i = 0; i < shardsStacks; i++) shards.addStack(); // Накидываем стаки

    }

    if (burnStacks > 0) {
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
        for(let i = 0; i < burnStacks; i++) burnEffect.addStack(); // Накидываем стаки
    }

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

    let time = 0;

    while (enemies.some(e => e.isAlive) && time < 30000) {
        tick(hero, enemies, time);
        time += 100; // двигаем время на 100мс
    }

    // 4. Возвращаем результат
    const isWin = !enemies.some(e => e.isAlive);
    return { win: isWin, time: time / 1000 };
}

/// Делаем функцию глобальной, чтобы она была доступна из HTML кнопки
window.startAnalysis = function() {
    const iterations = parseInt(document.getElementById('iterations').value);
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '<p>Идет симуляция...</p>'; // Заглушка

    // Твой массив testCases
    const testCases = [
        { shards: 0, burn: 0, name: "Без эффектов" },
        { shards: 5, burn: 0, name: "Только Осколки" },
        { shards: 0, burn: 5, name: "Только Горение" },
        { shards: 3, burn: 3, name: "Осколки + Горение" }
    ];

    let htmlOutput = "";

    testCases.forEach(test => {
        let wins = 0;
        let totalTime = 0;

        for (let i = 0; i < iterations; i++) {
            const result = runSimulation(test.shards, test.burn);
            if (result.win) wins++;
            totalTime += result.time;
        }

        const winrate = (wins / iterations) * 100;
        const avgTime = (totalTime / iterations).toFixed(1);

        // Формируем HTML для каждой сборки
        const isImba = winrate > 90 && avgTime < 15;
        const styleClass = isImba ? "highlight" : "";

        htmlOutput += `
            <div class="result-item ${styleClass}">
                <strong>${test.name}</strong><br>
                Винрейт: ${winrate.toFixed(1)}% | Среднее время: ${avgTime} сек.
                ${isImba ? '<br><small>⚠️ Обнаружена имба-сборка!</small>' : ''}
            </div>
        `;
    });

    resultsDiv.innerHTML = htmlOutput;
};



