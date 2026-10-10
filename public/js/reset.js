class ResetForm {
    constructor(formId, submitBtnId) {
        this.form = document.getElementById(formId);
        this.submitBtn = document.getElementById(submitBtnId);
        this.password = document.getElementById('password');
        this.confirm = document.getElementById('confirm');
        this.passError = document.getElementById('invalid-pass');
        this.confirmError = document.getElementById('invalid-confirm');

        this.form.addEventListener('submit', (event) => this.reset(event));
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

    reset(event) {
        event.preventDefault();

        const passwordValue = this.password.value;
        const confirmValue = this.confirm.value;

        this.passError.textContent = '';
        this.confirmError.textContent = '';

        if (passwordValue.trim() === '') {
            return this.showError(this.password, this.passError, 'Passwords cannot be empty');
        }
        if (passwordValue.length < 8) {
            return this.showError(this.password, this.passError, 'Password must be at least 8 characters');
        }
        if (confirmValue.trim() === '') {
            return this.showError(this.confirm, this.confirmError, 'Please confirm your password');
        }
        if (passwordValue !== confirmValue) {
            return this.showError(this.confirm, this.confirmError, 'Passwords do not match');
        }

        this.toggleButton(false, 'Saving...');

        this.form.submit();
    }
}

// eslint-disable-next-line no-unused-vars
const _resetForm = new ResetForm('resetForm', 'submitBtn');
