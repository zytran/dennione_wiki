class ForgotForm {
    constructor(formId, submitBtnId) {
        this.form = document.getElementById(formId);
        this.submitBtn = document.getElementById(submitBtnId);
        this.email = document.getElementById('email');
        this.emailError = document.getElementById('invalid-email');

        this.form.addEventListener('submit', (event) => this.submit(event));
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

    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    submit(event) {
        event.preventDefault();

        const emailValue = this.email.value.trim();

        this.emailError.textContent = '';

        if (emailValue === '') {
            return this.showError(this.email, this.emailError, 'Email cannot be empty');
        }
        if (!this.validateEmail(emailValue)) {
            return this.showError(this.email, this.emailError, 'Please enter a valid email address');
        }

        this.toggleButton(false, 'Sending...');

        this.form.submit();
    }
}

// eslint-disable-next-line no-unused-vars
const _forgotForm = new ForgotForm('forgotForm', 'submitBtn');
