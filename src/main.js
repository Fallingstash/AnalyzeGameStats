import { Hero } from "./entities/Hero.js";
import { EventBus } from "./core/EventBus.js";
import { Effect } from "./core/Effect.js";
import { Enemy } from "./entities/Enemy.js";
import { BurnStatus } from "./effects/BurnStatus.js";
import { PoisonStatus } from "./effects/PoisonStatus.js";

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

    const aliveEnemies = enemies.filter(e => e.isAlive);
    const randomIndex = Math.floor(Math.random() * aliveEnemies.length);
    const currentEnemy = aliveEnemies[randomIndex];

    if (currentEnemy) {
        // Герой пытается атаковать
        hero.attack(currentEnemy, currentTime);
        
    }

}

function runSimulation(shardsStacks, burnStacks, poisonStaks, multiShotStacks, maxTime) {
    const bus = new EventBus();
    const hero = new Hero(100, 10, 2, bus);

    const enemies = [];
    for(let i = 0; i < 8; i++) {
        enemies.push(new Enemy(30 + i * 5, 5, bus)); // Чуть разнообразнее хп
    }

    if (multiShotStacks) {
        const multishot = new Effect(
            "multishot",
            "SPAWN_BULLET",
            "ENEMY",
            "attackByHero",
            1, // в данном случае значение 1 = одному ДОП выстрелу
            "MULTIPLY",
            0,
            "COUNT",
            bus
        );
        for (let i = 0; i < multiShotStacks; ++i) multishot.addStack();
    }

    bus.on("SPAWN_BULLET", (data) => {
        for (let i = 0; i < data.effect.getValue(); ++i) {
            const aliveEnemies = enemies.filter(e => e.isAlive);
            if (aliveEnemies.length === 0) break;

            const randomIndex = Math.floor(Math.random() * aliveEnemies.length);
            const currentTarget = aliveEnemies[randomIndex];
            currentTarget.takeHeroAttack(hero.damage * 0.5);
        }
    });

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
            
            target.addStatus(new BurnStatus("fire", target, duration, hero.damage * 0.2));
        }
    });

    if (poisonStaks > 0) {
        const poisonEffect = new Effect(
            "poison",
            "APPLY_POISON",
            "ENEMY",
            "attackedByHero",
            5,
            "ADD",
            1.5,
            "DURATION",
            bus
        );
        for (let i = 0; i < poisonStaks; ++i) poisonEffect.addStack(); // Накидываем стаки
    }

    bus.on("APPLY_POISON", (data) => {
        const enemyId = data.payload.enemyId;

        const target = enemies.find(e => e.id === enemyId);

        if (target && target.isAlive) {
            const effect = data.effect;
            const duration = effect.getValue();

            target.addStatus(new PoisonStatus("poison", target, duration, hero.damage * 0.3));
        }
    });

    let time = 0;

    while (enemies.some(e => e.isAlive) && time < maxTime) {
        tick(hero, enemies, time);
        time += 100; // двигаем время на 100мс
    }

    // 4. Возвращаем результат
    const isWin = !enemies.some(e => e.isAlive);
    return { win: isWin, time: time / 1000 };
}

/// Делаем функцию глобальной, чтобы она была доступна из HTML кнопки
window.startAnalysis = function() {
    const maxTime = 30000; // millisec
    const iterations = parseInt(document.getElementById('iterations').value);
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '<p>Идет симуляция...</p>'; // Заглушка

   const testCases = [
        // База
        { shards: 0, burn: 0, poison: 0, multishot: 0, name: "Без эффектов" },

        // 1 эффект (по 5 стаков)
        { shards: 5, burn: 0, poison: 0, multishot: 0, name: "Только Осколки" },
        { shards: 0, burn: 5, poison: 0, multishot: 0, name: "Только Горение" },
        { shards: 0, burn: 0, poison: 5, multishot: 0, name: "Только Яд" },
        { shards: 0, burn: 0, poison: 0, multishot: 5, name: "Только Мультивыстрел" },

        // 2 эффекта (по 4 стака)
        { shards: 4, burn: 4, poison: 0, multishot: 0, name: "Осколки + Горение" },
        { shards: 4, burn: 0, poison: 4, multishot: 0, name: "Осколки + Яд" },
        { shards: 0, burn: 4, poison: 4, multishot: 0, name: "Горение + Яд" },
        { shards: 4, burn: 0, poison: 0, multishot: 4, name: "Осколки + Мультивыстрел" },
        { shards: 0, burn: 4, poison: 0, multishot: 4, name: "Горение + Мультивыстрел" },
        { shards: 0, burn: 0, poison: 4, multishot: 4, name: "Яд + Мультивыстрел" },

        // 3 эффекта (по 3 стака)
        { shards: 3, burn: 3, poison: 3, multishot: 0, name: "Осколки + Горение + Яд" },
        { shards: 3, burn: 3, poison: 0, multishot: 3, name: "Осколки + Горение + Мультивыстрел" },
        { shards: 3, burn: 0, poison: 3, multishot: 3, name: "Осколки + Яд + Мультивыстрел" },
        { shards: 0, burn: 3, poison: 3, multishot: 3, name: "Горение + Яд + Мультивыстрел" },

        // 4 эффекта (God Mode, по 2 стака)
        { shards: 2, burn: 2, poison: 2, multishot: 2, name: "ВСЁ ВМЕСТЕ (God Mode)" }
    ];

    let htmlOutput = "";

    testCases.forEach(test => {
        let wins = 0;
        let totalTime = 0;

        for (let i = 0; i < iterations; i++) {
            const result = runSimulation(test.shards, test.burn, test.poison, test.multishot, maxTime);
            if (result.win) wins++;
            totalTime += result.time;
        }

        const winrate = (wins / iterations) * 100;
        const avgTime = (totalTime / iterations).toFixed(1);

        // Формируем HTML для каждой сборки
        const isImba = winrate > 90 && avgTime < maxTime / 1000;
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



