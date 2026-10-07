class LoginForm {
    constructor(formId, submitBtnId) {
        this.form = document.getElementById(formId);
        this.submitBtn = document.getElementById(submitBtnId);
        this.username = document.getElementById('username');
        this.password = document.getElementById('password');
        this.userError = document.getElementById('invalid-user');
        this.passError = document.getElementById('invalid-pass');

        this.form.addEventListener('submit', (event) => this.login(event));
    }

    showError(inputElement, errorElement, message, duration = 3000) {
        errorElement.textContent = message;
        inputElement.focus();
        setTimeout(() => (errorElement.textContent = ''), duration);
    }

    toggleButton(enabled, text) {
        this.submitBtn.disabled = !enabled;
        this.submitBtn.textContent = text;
    }

    login(event) {
        event.preventDefault();

        const usernameValue = this.username.value.trim();
        const passwordValue = this.password.value.trim();

        this.userError.textContent = '';
        this.passError.textContent = '';

        if (usernameValue === '') {
            return this.showError(this.username, this.userError, 'Username or email cannot be empty');
        }
        if (passwordValue === '') {
            return this.showError(this.password, this.passError, 'Password cannot be empty');
        }

        this.toggleButton(false, 'Logging in...');

        this.form.submit();
    }
}

// eslint-disable-next-line no-unused-vars
const _loginForm = new LoginForm('loginForm', 'submitBtn');

