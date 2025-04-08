document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('checkoutForm');
    
    const paymentMethods = document.querySelectorAll('input[name="paymentMethod"]');
    const creditCardFields = document.getElementById('creditCardFields');
    
    paymentMethods.forEach(method => {
        method.addEventListener('change', function() {
            if (method.id === 'creditCard') {
                creditCardFields.style.display = 'block';
            } else {
                creditCardFields.style.display = 'none';
            }
        });
    });
    
    const fields = [
        { id: 'firstName', errorId: 'firstName-error', validate: function(field) {
            const name = /^[A-Za-z ]+$/;
            return field.value.trim() !== '' && name.test(field.value);
        }},
        { id: 'lastName', errorId: 'lastName-error', validate: function(field) {
            const name = /^[A-Za-z ]+$/;
            return field.value.trim() !== '' && name.test(field.value);
        }},
        { id: 'email', errorId: 'email-error', validate: function(field) {
            const email = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            return email.test(field.value);
        }},
        { id: 'phone', errorId: 'phone-error', validate: function(field) {
            const phone = /^[0-9]+$/;
            const length = field.value.length;
            return phone.test(field.value) && length >= 10 && length <= 15;
        }},
        { id: 'address', errorId: 'address-error', validate: function(field) {
            return field.value.trim().length >= 5;
        }},
        { id: 'city', errorId: 'city-error', validate: function(field) {
            const city = /^[A-Za-z ]+$/;
            return field.value.trim() !== '' && city.test(field.value);
        }},
        { id: 'state', errorId: 'state-error', validate: function(field) {
            return field.value !== '';
        }},
        { id: 'zipCode', errorId: 'zipCode-error', validate: function(field) {
            return field.value.trim() !== '';
        }},
        { id: 'country', errorId: 'country-error', validate: function(field) {
            return field.value !== '';
        }},
        { id: 'cardNumber', errorId: 'cardNumber-error', validate: function(field) {
            const card = /^[0-9]{16}$/;
            return card.test(field.value);
        }},
        { id: 'expiryDate', errorId: 'expiryDate-error', validate: function(field) {
            const expiry = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
            if (!expiry.test(field.value)) {
                return false;
            }
            
            const [month, year] = field.value.split('/');
            const expiryDate = new Date(2000 + parseInt(year), parseInt(month) - 1);
            const today = new Date();
            return expiryDate > today;
        }},
        { id: 'cvv', errorId: 'cvv-error', validate: function(field) {
            const cvv = /^[0-9]{3}$/;
            return cvv.test(field.value);
        }}
    ];
    
    fields.forEach(field => {
        const element = document.getElementById(field.id);
        if (element) {
            element.addEventListener('input', function() {
                validateField(this, field.errorId, field.validate);
            });
            
            if (field.id === 'cardNumber') {
                element.addEventListener('input', function() {
                    this.value = this.value.replace(/[^\d]/g, '').substring(0, 16);
                });
            } else if (field.id === 'phone') {
                element.addEventListener('input', function() {
                    this.value = this.value.replace(/[^\d]/g, '').substring(0, 15);
                });
            } else if (field.id === 'expiryDate') {
                element.addEventListener('input', function() {
                    formatExpiryDate(this);
                });
            } else if (field.id === 'cvv') {
                element.addEventListener('input', function() {
                    this.value = this.value.replace(/[^\d]/g, '').substring(0, 3);
                });
            }
        }
    });
    
    form.addEventListener('submit', function(event) {
        event.preventDefault();
        
        let isValid = true;
        
        fields.forEach(field => {
            const element = document.getElementById(field.id);
            if (element) {
                if (['cardNumber', 'expiryDate', 'cvv'].includes(field.id)) {
                    if (document.getElementById('creditCard').checked) {
                        isValid = validateField(element, field.errorId, field.validate) && isValid;
                    }
                } else {
                    isValid = validateField(element, field.errorId, field.validate) && isValid;
                }
            }
        });
        
        if (isValid) {
            alert("Order placed successfully!");
            form.reset();
            
            const errorMessages = document.querySelectorAll('.error-message');
            errorMessages.forEach(message => {
                message.style.display = 'none';
            });
            
            const inputs = form.querySelectorAll('input, select');
            inputs.forEach(input => {
                input.classList.remove('error');
            });
        }
    });
    
    function validateField(field, errorId, validateFn) {
        const errorElement = document.getElementById(errorId);
        
        if (!validateFn(field)) {
            field.classList.add('error');
            errorElement.style.display = 'block';
            return false;
        } else {
            field.classList.remove('error');
            errorElement.style.display = 'none';
            return true;
        }
    }
    
    function formatExpiryDate(input) {
        let value = input.value.replace(/\D/g, '');
        
        if (value.length > 2) {
            input.value = value.substring(0, 2) + '/' + value.substring(2, 4);
        } else {
            input.value = value;
        }
    }
});