function updateQuantity(productId, newQuantity) {
    if (newQuantity < 1) {
        removeFromCart(productId);
        return;
    }
    
    const quantityInput = document.getElementById(`qty-${productId}`);
    const originalValue = quantityInput.value;
    quantityInput.disabled = true;
    
    $.ajax({
        url: '/cart/update',
        method: 'POST',
        data: { 
            productId: productId, 
            quantity: newQuantity 
        },
        success: function(response) {
            if (response.success) {
                location.reload();
            } else {
                showAlert('danger', response.message || 'Error updating quantity');
                quantityInput.value = originalValue;
            }
        },
        error: function(xhr) {
            const errorMessage = xhr.responseJSON ? 
                xhr.responseJSON.message : 'Error updating cart';
            showAlert('danger', errorMessage);
            quantityInput.value = originalValue;
        },
        complete: function() {
            quantityInput.disabled = false;
        }
    });
}

function removeFromCart(productId) {
    if (!confirm('Are you sure you want to remove this item from your cart?')) {
        return;
    }
    
    const itemElement = document.getElementById(`item-${productId}`);
    itemElement.style.opacity = '0.5';
    
    $.ajax({
        url: '/cart/remove',
        method: 'POST',
        data: { productId: productId },
        success: function(response) {
            if (response.success) {
                showAlert('success', response.message || 'Item removed from cart');
                setTimeout(() => {
                    location.reload();
                }, 1000);
            } else {
                showAlert('danger', response.message || 'Error removing item');
                itemElement.style.opacity = '1';
            }
        },
        error: function(xhr) {
            const errorMessage = xhr.responseJSON ? 
                xhr.responseJSON.message : 'Error removing item from cart';
            showAlert('danger', errorMessage);
            itemElement.style.opacity = '1';
        }
    });
}

function clearCart() {
    if (!confirm('Are you sure you want to clear your entire cart? This action cannot be undone.')) {
        return;
    }
    
    $.ajax({
        url: '/cart/clear',
        method: 'POST',
        success: function(response) {
            if (response.success) {
                showAlert('success', response.message || 'Cart cleared successfully');
                setTimeout(() => {
                    location.reload();
                }, 1000);
            } else {
                showAlert('danger', response.message || 'Error clearing cart');
            }
        },
        error: function(xhr) {
            const errorMessage = xhr.responseJSON ? 
                xhr.responseJSON.message : 'Error clearing cart';
            showAlert('danger', errorMessage);
        }
    });
}

function proceedToCheckout() {
    window.location.href = '/orders/checkout';
}

function applyPromoCode() {
    const promoCode = document.getElementById('promoCode').value.trim();
    
    if (!promoCode) {
        showAlert('warning', 'Please enter a promo code');
        return;
    }
    
    const button = event.target;
    const originalText = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    
    $.ajax({
        url: '/cart/promo',
        method: 'POST',
        data: { promoCode: promoCode },
        success: function(response) {
            if (response.success) {
                showAlert('success', response.message || 'Promo code applied successfully');
                setTimeout(() => {
                    location.reload();
                }, 1000);
            } else {
                showAlert('danger', response.message || 'Invalid promo code');
            }
        },
        error: function(xhr) {
            const errorMessage = xhr.responseJSON ? 
                xhr.responseJSON.message : 'Error applying promo code';
            showAlert('danger', errorMessage);
        },
        complete: function() {
            button.disabled = false;
            button.innerHTML = originalText;
        }
    });
}

function showAlert(type, message) {
    const alertHtml = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'warning' ? 'exclamation-triangle' : 'exclamation-triangle'}"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    
    $('#alertContainer').append(alertHtml);
    
    setTimeout(() => {
        $('#alertContainer .alert').last().fadeOut();
    }, 3000);
}

function updateCartCount(count) {
    const cartCountElement = document.querySelector('.cart-count, #cart-count');
    if (cartCountElement) {
        cartCountElement.textContent = count;
    }
    
    const cartBadge = document.querySelector('.cart-badge');
    if (cartBadge) {
        cartBadge.textContent = count;
        cartBadge.style.display = count > 0 ? 'inline' : 'none';
    }
}