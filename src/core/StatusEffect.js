export class StatusEffect {
    constructor(id, target, duration) {
        this.id = id;
        this.target = target;
        this.duration = duration;
        this.timeLeft = duration;
        this.isExpired = false;
    }

    tick(deltaTime, target) {
        if (this.isExpired) return;
        
        this.timeLeft -= deltaTime / 1000; // Преобразуем deltaTime из миллисекунд в секунды

        if(this.timeLeft <= 0) {
            this.isExpired = true;
            return;
        }
    }
}