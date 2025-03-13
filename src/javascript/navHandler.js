$(document).ready(function() {
    function setActiveSection() {
        const scrollPosition = $(window).scrollTop();
        

        $('section').each(function() {
            const sectionTop = $(this).offset().top - 100;
            const sectionBottom = sectionTop + $(this).outerHeight();
            const sectionId = $(this).attr('id');
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
                $('.nav-item').removeClass('active');
                
                $(`.nav-item a[href="#${sectionId}"]`).parent().addClass('active');
            }
        });
    }

    $(window).on('scroll', setActiveSection);

});