$(document).ready(function() {
    $('#mobile_btn').on('click', function() {
        $('#mobile_menu').toggleClass('active');
        $('#mobile_btn').find('i').toggleClass('fa-bars fa-xmark');
    });

    $('a[href^="#"]').on('click', function(e) {
        e.preventDefault();
        
        const targetId = $(this).attr('href');
        const targetElement = $(targetId);
        
        if (targetElement.length) {
            const offset = targetElement.offset().top - 80;
            
            $('html, body').animate({
                scrollTop: offset
            }, 800);
            
            $('#mobile_menu').removeClass('active');
            $('#mobile_btn').find('i').removeClass('fa-xmark').addClass('fa-bars');
        }
    });

    $('.btn-quote, .btn-contrate, .btn-default, .cta_button .btn-default').on('click', function(e) {
        e.preventDefault();
        
        const formsSection = $('.forms');
        if (formsSection.length) {
            const offset = formsSection.offset().top - 80;
            
            $('html, body').animate({
                scrollTop: offset
            }, 800);
            
            $('#mobile_menu').removeClass('active');
            $('#mobile_btn').find('i').removeClass('fa-xmark').addClass('fa-bars');
        }
    });
});