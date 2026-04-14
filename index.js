document.addEventListener('DOMContentLoaded', function() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const cards = document.querySelectorAll('.card');

    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons and cards
            tabButtons.forEach(btn => btn.classList.remove('active'));
            cards.forEach(card => card.classList.remove('active'));

            // Add active class to clicked button
            this.classList.add('active');

            // Show corresponding card
            const tab = this.getAttribute('data-tab');
            document.querySelector(`.${tab}-card`).classList.add('active');
        });
    });
});