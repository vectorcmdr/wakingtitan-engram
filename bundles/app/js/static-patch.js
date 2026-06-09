// Waking Titan static edition - local answer checking
// Overrides the AJAX form submission with client-side validation.
(function() {
    'use strict';

    // ---- DIAGNOSTIC: footer slider state ----
    function diagSlider() {
      var slider = document.getElementById('footerSlider');
      var footer = document.getElementById('footer');
      var glyphs = slider ? slider.querySelectorAll('.glyph') : [];
      var visible = slider ? slider.querySelectorAll('.glyph.visible') : [];
      var style = slider ? getComputedStyle(slider).display : 'N/A';
      var footerStyle = footer ? getComputedStyle(footer).display : 'N/A';
      var sliderInlineStyle = slider ? slider.getAttribute('style') : 'N/A';
      var msg = [
        '[DIAG] footer: display=' + footerStyle + ' bottom=' + (footer ? getComputedStyle(footer).bottom : 'N/A') + (footer ? ' z-index=' + getComputedStyle(footer).zIndex : ''),
        '[DIAG] #footerSlider: display=' + style + ' exists=' + !!slider + ' inline="' + sliderInlineStyle + '"',
        '[DIAG] glyphs: ' + glyphs.length + ' total, ' + visible.length + ' .visible',
        '[DIAG] o object exists: ' + (typeof window.o !== 'undefined') + ' (var o is local in init, expected undefined)',
        '[DIAG] terminal element: ' + !!document.getElementById('terminal'),
      ];
      msg.forEach(function(m) { console.log(m); });
      // Force visible for testing
      if (slider) {
        slider.style.setProperty('display', 'block', 'important');
        var g;
        for (g = 0; g < glyphs.length && g < 5; g++) {
          glyphs[g].classList.add('visible');
        }
        console.log('[DIAG] forced #footerSlider display=block and first 5 glyphs visible');
      }
    }
    if (document.readyState === 'complete') {
      setTimeout(diagSlider, 2000);
    } else {
      window.addEventListener('load', function() { setTimeout(diagSlider, 2000); });
    }

    // ----- Answer lookup table -----
    // Populate with real answers as they're discovered.
    // "EMILY" is the placeholder for all puzzles.
    var ANSWERS = {
        'archive-1': 'EMILY',
        'archive-2': 'EMILY',
        'archive-4': 'EMILY',
        'archive-5': 'EMILY',
        'archive-6': 'EMILY',
        'archive-7': 'EMILY',
        'archive-8': 'EMILY',
        'archive-9': 'EMILY',
        'archive-10': 'EMILY',
        'archive-11': 'EMILY',
        'archive-12': 'EMILY',
    };

    // Capture default video source before init changes it
    var videoSrc = document.querySelector('video source');
    window.initDefaultVideo = videoSrc ? videoSrc.src : '';

    // Wait for init() to bind its handler, then override
    function patch() {
        var form = document.getElementById('argform');
        if (!form) return;

        // Unbind all jQuery submit handlers on #argform
        $('#argform').off('submit');

        // Bind our own
        $('main').on('submit', '#argform', function(e) {
            e.preventDefault();

            var $form = $(this);
            var $editor = $form.find('.texteditor');
            var $textarea = $form.find('textarea');
            var $writer = $form.find('#writer');
            var answer = $textarea.val().trim().toLowerCase();

            // Determine which archive page this is
            var action = $form.attr('action').replace(/^\//, '');  // e.g. "archive-1"
            var expected = (ANSWERS[action] || 'EMILY').toLowerCase();

            $editor.addClass('select');
            $textarea.focus();

            if (answer === expected) {
                // ---- WIN ----
                setTimeout(function() {
                    $editor.removeClass('select');
                    $editor.addClass('finish');
                    $form.find('.options').fadeOut();
                    $writer.html('GRANTED').removeClass('fill empty');

                    $('#validation').fadeTo(500, 1);
                    $('#viewport').stop().fadeTo(500, 1);

                    setTimeout(function() {
                        $form.fadeOut();
                        $('#terminal').show();
                        setTimeout(function() {
                            $('#terminal textarea').focus();
                        }, 1000);
                        $('#shade').fadeOut();

                        // Stub the SVG hexagon load
                        $('#hexagone').html('<svg viewBox="0 0 200 200"><polygon points="100,10 190,55 190,145 100,190 10,145 10,55" fill="none" stroke="#00ff88" stroke-width="2"/></svg>');
                        if (window.a && a.SetGlow) a.SetGlow();

                        $('#validation').fadeTo(500, 0, function() {
                            $(this).css({ display: 'none' });
                        });
                        $('#replay-btn').fadeIn();

                        // Reset video to default
                        var video = document.querySelector('video');
                        if (video) {
                            video.src = window.initDefaultVideo || video.src;
                            video.loop = true;
                        }
                    }, 3000);
                }, 1000);

            } else {
                // ---- LOOSE ----
                $editor.addClass('error');
                $form.addClass('red');
                $writer.html('');
                $textarea.val('');
                $('#validation').fadeTo(500, 1);

                setTimeout(function() {
                    $('#validation').stop().fadeTo(500, 0);
                    $editor.removeClass('error');
                    $form.removeClass('red');
                }, 2000);
            }
        });

        // Hook the existing close button behavior
        $('main').on('click', 'a.return', function(e) {
            e.preventDefault();
            $('#argform').fadeOut();
            $('#terminal').show();
            setTimeout(function() { $('#terminal textarea').focus(); }, 1000);
        });
    }

    // Run after DOM and app.min.js are both ready
    if (document.readyState === 'complete') {
        setTimeout(patch, 500);
    } else {
        window.addEventListener('load', function() {
            setTimeout(patch, 500);
        });
    }
})();
