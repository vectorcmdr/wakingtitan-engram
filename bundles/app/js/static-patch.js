// Waking Titan static edition - local answer checking & SPA glyph loader
// Overrides the AJAX form submission with client-side validation
// and loads archive forms into index.html via AJAX (no page navigation).
(function() {
    'use strict';

    // Stub Google Analytics (never defined in static context)
    if (typeof window.ga !== 'function') {
        window.ga = function() {};
    }

    // Stub audio effect methods (called by original app.min.js timeout chains)
    window.Phase = function() {
        var a = document.getElementById('audioPhaser');
        if (a) { a.currentTime = 0; a.play(); }
    };
    window.Key = function() {
        var a = document.getElementById('audioKey');
        if (a) { a.currentTime = 0; a.play(); }
    };
    window.Glitch = function() {
        var a = document.getElementById('audioGlitch');
        if (a) { a.currentTime = 0; a.play(); }
    };

    // Capture default video source before any handler changes it
    var videoSrc = document.querySelector('video source');
    window.initDefaultVideo = videoSrc ? videoSrc.src : '';

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

    // ----- Glyph click handler (SPA form loader) -----
    // Intercept glyph clicks, AJAX-load the archive form into .form div
    function setupGlyphHandler() {
        $('#footer').on('click', 'a.glyph', function(e) {
            e.preventDefault();
            var href = $(this).attr('href');   // e.g. "archive-1.html"

            $('#replay-confirm').fadeOut();

            $.ajax({
                url: href,
                success: function(data) {
                    // Handle "video=>" responses (some glyphs redirect to video)
                    if (typeof data === 'string' && data.indexOf('video=>') === 0) {
                        var video = document.querySelector('video');
                        if (video) {
                            video.src = data.replace('video=>', '');
                            video.loop = false;
                        }
                        return;
                    }

                    $('#replay-btn').fadeOut();
                    $('#shade').fadeIn();
                    $('.form').html(data).fadeIn();
                    $('#terminal').hide();
                    $('#argform').fadeIn();
                    $('#argform textarea').focus();
                    $('#viewport').stop().fadeTo(500, 0.5);
                    $('main svg').empty();

                    // If the loaded form has a data-brief attribute, switch video
                    var $form = $('.form > form');
                    if ($form.length && $form.data('brief') && $form.data('brief') !== '') {
                        var video = document.querySelector('video');
                        if (video) {
                            video.src = $form.data('brief');
                            video.loop = true;
                        }
                    }

                    window.Phase();  // play phaser sound
                },
                error: function() {
                    // Fallback: navigate directly if AJAX fails
                    window.location.href = href;
                }
            });
        });
    }

    // ----- Return/Close button handler -----
    function setupReturnHandler() {
        $(document).on('click', 'a.return', function(e) {
            e.preventDefault();
            closeForm();
        });
    }

    // ----- Escape key -----
    function setupEscapeHandler() {
        $(document).on('keydown', function(e) {
            if (e.key === 'Escape' && $('#argform').is(':visible')) {
                closeForm();
            }
        });
    }

    function closeForm() {
        $('#argform').fadeOut();
        $('#terminal').show();
        $('.form').empty();
        $('#shade').fadeOut();
        $('#viewport').stop().fadeTo(500, 1);
        // Reset video to default
        var video = document.querySelector('video');
        if (video && window.initDefaultVideo) {
            video.src = window.initDefaultVideo;
            video.loop = true;
        }
        setTimeout(function() {
            var ta = $('#terminal textarea');
            if (ta.length) ta.focus();
        }, 1000);
    }

    // ----- Form submit override (local answer checking) -----
    function setupFormHandler() {
        // Remove any handler the original init() might have set
        $(document).off('submit', '#argform');
        $(document).on('submit', '#argform', function(e) {
            e.preventDefault();

            var $form = $(this);
            var $editor = $form.find('.texteditor');
            var $textarea = $form.find('textarea');
            var $writer = $form.find('#writer');
            var answer = $textarea.val().trim().toLowerCase();

            // Determine which archive page this is (strip leading /)
            var action = $form.attr('action').replace(/^\//, '');
            var expected = (ANSWERS[action] || 'EMILY').toLowerCase();

            $editor.addClass('select');
            $textarea.focus();

            // Reset validation overlay to good image before showing
            var $v = $('#validation');
            if ($v.length) $v.css({ backgroundImage: '' });

            if (answer === expected) {
                // ---- WIN ----
                setTimeout(function() {
                    $editor.removeClass('select');
                    $editor.addClass('finish');
                    $form.find('.options').fadeOut();
                    $writer.html('GRANTED').removeClass('fill empty');

                    // Guard: elements may not exist on archive pages
                    if ($v.length) $v.fadeTo(500, 1);

                    var $vp = $('#viewport');
                    if ($vp.length) $vp.stop().fadeTo(500, 1);

                    setTimeout(function() {
                        $form.fadeOut();

                        var $term = $('#terminal');
                        if ($term.length) $term.show();

                        setTimeout(function() {
                            var ta = $('#terminal textarea');
                            if (ta.length) ta.focus();
                        }, 1000);

                        var $shade = $('#shade');
                        if ($shade.length) $shade.fadeOut();

                        // Stub hexagon SVG into container
                        var $hex = $('#hexagone');
                        if ($hex.length) {
                            $hex.html('<svg viewBox="0 0 200 200"><polygon points="100,10 190,55 190,145 100,190 10,145 10,55" fill="none" stroke="#00ff88" stroke-width="2"/></svg>');
                        }

                        if ($v.length) {
                            $v.fadeTo(500, 0, function() {
                                $(this).css({ display: 'none' });
                            });
                        }

                        var $replay = $('#replay-btn');
                        if ($replay.length) $replay.fadeIn();

                        // Reset video to default
                        var video = document.querySelector('video');
                        if (video && window.initDefaultVideo) {
                            video.src = window.initDefaultVideo;
                            video.loop = true;
                        }

                        window.Glitch();
                    }, 3000);
                }, 1000);

            } else {
                // ---- LOSE ----
                $editor.addClass('error');
                $form.addClass('red');
                $writer.html('');
                $textarea.val('');

                setTimeout(function() {
                    $editor.removeClass('error');
                    $form.removeClass('red');
                }, 2000);
            }
        });
    }

    // ----- Mute button handler -----
    function setupMuteHandler() {
        $('#muted-btn').on('click', function(e) {
            e.preventDefault();
            $(this).toggleClass('no-sound');
            var muted = $(this).hasClass('no-sound');
            $('video').prop('muted', muted);
            $('audio').prop('muted', muted);
        });
    }

    // ----- Init all -----
    function initStatic() {
        setupGlyphHandler();
        setupReturnHandler();
        setupEscapeHandler();
        setupFormHandler();
        setupMuteHandler();

        // Enable footer slider (was display:none by default)
        var slider = document.getElementById('footerSlider');
        if (slider) {
            slider.style.display = 'block';
        }
    }

    // Run after DOM ready
    if (document.readyState === 'complete') {
        setTimeout(initStatic, 500);
    } else {
        window.addEventListener('load', function() {
            setTimeout(initStatic, 500);
        });
    }
})();
