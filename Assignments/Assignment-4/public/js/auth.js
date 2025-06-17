document.addEventListener('DOMContentLoaded', function () {
    const form = document.querySelector('.auth-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    form.addEventListener('submit', function (e) {
        let valid = true;
        let errorMessage = '';

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailInput.value.trim()) {
            valid = false;
            errorMessage = 'Email is required.';
        } else if (!emailPattern.test(emailInput.value.trim())) {
            valid = false;
            errorMessage = 'Please enter a valid email address.';
        } else if (!passwordInput.value.trim()) {
            valid = false;
            errorMessage = 'Password is required.';
        } else if (passwordInput.value.length < 6) {
            valid = false;
            errorMessage = 'Password must be at least 6 characters long.';
        }

        if (!valid) {
            e.preventDefault();
            showError(errorMessage);
        }
    });

    function showError(message) {
        const existingAlert = document.querySelector('.alert');
        if (existingAlert) {
            existingAlert.remove();
        }

        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-danger';
        alertDiv.role = 'alert';
        alertDiv.textContent = message;

        const container = document.querySelector('.auth-form-container');
        container.insertBefore(alertDiv, container.firstChild);
    }
});