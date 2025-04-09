document.addEventListener('DOMContentLoaded', function() {

    const modal = document.getElementById('previous-tasks-modal');
    const modalBtn = document.getElementById('previous-tasks-btn');
    
    modalBtn.addEventListener('click', function(e) {
        e.preventDefault(); 
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    });
    
   
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });
});