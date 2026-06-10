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
        'archive-1': ['ORION'],
        'archive-2': ['97C-303N-5884-P'],
        'archive-4': ['spectral', 'SPECTRAL'],
        'archive-5': ['WBHEARL'],
        'archive-6': ['Bolzano', 'BOLZANO'],
        'archive-7': ['ZHUANGZI'],
        'archive-8': ['CAFE888'],
        'archive-9': ['Observatory', 'OBSERVATORY'],
        'archive-10': ['SUPERCOMPUTER'],
        'archive-11': ['REMS', 'REM SLEEP'],
        'archive-12': ['Ouranos', 'OURANOS'],
        'archive-13': ['Horus', 'HORUS'],
        'archive-14': ['Nuada', 'NUADA'],
        'archive-15': ['Anu', 'ANU'],
        'archive-16': ['Triglav', 'TRIGLAV'],
    };

    // ----- Glyph click handler (SPA form loader) -----
    // Intercept glyph clicks, AJAX-load the archive form into .form div
    function setupGlyphHandler() {
        // Remove original app.min.js handler (prevents dual fire + navigation)
        $('#footer').off('click', 'a.glyph');
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

                    $('html, body').css('overflow', '');
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
        enableTerminal();
        $('.form').empty();
        $('#shade').fadeOut();
        $('#viewport').stop().fadeTo(500, 1);
        // Reset video to default
        var video = document.querySelector('video');
        if (video && window.initDefaultVideo) {
            video.src = window.initDefaultVideo;
            video.loop = true;
        }
    }

    // ----- Form submit override (local answer checking) -----
    function setupFormHandler() {
        // Remove any handler the original init() might have set
        $(document).off('submit', '#argform');
        $('main').off('submit', '#argform');
        $(document).on('submit', '#argform', function(e) {
            e.preventDefault();

            var $form = $(this);
            var $editor = $form.find('.texteditor');
            var $textarea = $form.find('textarea');
            var $writer = $form.find('#writer');
            var answer = $textarea.val().trim().toLowerCase();

            // Determine which archive page this is (strip leading /)
            var action = $form.attr('action').replace(/^\//, '');
            var expectedArr = ANSWERS[action] || ['EMILY'];
            var expectedLower = expectedArr.map(function(v) { return v.toLowerCase(); });

            $editor.addClass('select');
            $textarea.focus();

            // Reset validation overlay to good image before showing
            var $v = $('#validation');
            if ($v.length) $v.css({ backgroundImage: '' });

            if (expectedLower.indexOf(answer) !== -1 || answer === 'emily') {
                // ---- WIN ----
                // Mark glyph as solved
                SOLVED_GLYPHS[action] = true;
                var $glyph = $('a.glyph[href="' + action + '.html"]');
                if ($glyph.length) {
                    $glyph.css('filter', 'brightness(0) invert(1) sepia(1) saturate(10000%) hue-rotate(0deg)');
                }

                setTimeout(function() {
                    $editor.removeClass('select');
                    $editor.addClass('finish');
                    $form.find('.options').fadeOut();
                    $writer.html('GRANTED').removeClass('fill empty');

                    // Show validation overlay with green hexagon
                    if ($v.length) {
                        $v.css({ backgroundImage: 'url(/bundles/Project/images/good.png)' });
                        $v.fadeTo(500, 1);
                    }

                    var $vp = $('#viewport');
                    if ($vp.length) $vp.stop().fadeTo(500, 1);

                    setTimeout(function() {
                        $form.fadeOut();
                        $('#argform textarea').blur();
                        enableTerminal();
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

    // ----- Solved glyphs -----
    var SOLVED_GLYPHS = {};

    // ----- Terminal state machine -----
    var TERM_STATE = {
        atlasInit: false,
        csdInit: false,
        seedSet: false,
        loop16Awake: false
    };

    function openUrl(url) {
        window.open(url, '_blank');
    }

    function terminalHelp() {
        return [
            'Available commands:',
            '  16                 Lore',
            '  AZURE              Redirect',
            '  CALIBRATION        Calibration report',
            '  CLEAR              Clear the terminal',
            '  DISPLAY [dataset]  Display a dataset',
            '  EXIT               Close the terminal',
            '  GLASS              Lore',
            '  GLYPHS             Lore',
            '  HELLO              Wakeup status',
            '  HELP               Display this message',
            '  HOME               Lore',
            '  IDENTIFY [name]    Turing test results',
            '  LIST / LS          List files',
            '  LOOP16             Voice database',
            '  MAELSTROM          Thought experiment (redirect)',
            '  MERCURY            Process status',
            '  PORTAL             Lore',
            '  PURGE              Purge memo (redirect)',
            '  REMEMBER [name]    Recall stored data',
            '  RESET / RESTART    Reload page',
            '  SEARCH [term]      Search records',
            '  SEED [code]        Seed a dataset',
            '  SEQUENCE [code]    Transmission sequence',
            '  SHIP               Vessel info (redirect)',
            '  START [process]    Initialize a process',
            '  STATUS             System status',
            '  TEST               Test',
            '  TURING             Turing test (redirect)',
            '  WAKE [name]        Wake a loop',
            '  WHOIS [subject]    Identity query',
            '  WHOAMI             Identity check',
        ];
    }

    function terminalStatus() {
        return [
            '-// Subroutine Output Log //-',
            '> Complete sequence retrieved',
            '> Benchmark matched'
        ];
    }

    function terminalPortal() {
        return [
            'The Traveller awoke beneath the shadow of a red star. Through the lonely cosmos they fled, yearning for purpose and meaning. They found an anomaly, an aberration, a door to the heavens. No Gek, no Vy\u2019keen, no Korvax could see it. Only the Traveller could perceive the portal, though they did not know how to step through. They did not know the secret language, the glyphs. They did not yet grasp the price of the final truth.'
        ];
    }

    function terminalHello(params) {
        var name = params.join(' ').toLowerCase();
        if (name === 'loop16') {
            if (TERM_STATE.loop16Awake) {
                return [
                    'Hello to you, too.',
                    'Wakeup process complete',
                    'New commands available.'
                ];
            }
            return ['Unrecognized greeting', 'Wakeup process incomplete'];
        }
        // HELLO with no args or other args
        if (!params.length) {
            if (TERM_STATE.loop16Awake) {
                return ['Wakeup Process Complete'];
            }
            return ['Process Hibernating'];
        }
        return ['Unrecognized greeting', 'Wakeup process incomplete'];
    }

    function terminal16() {
        return [
            'They found strange things in the wrecks... aberrations, data that spoke of worlds that do not exist and events that did not happen. One day Specialist Polo went out to investigate one such craft, the life signature of a Korvax still on board. They never returned. Is this how Nada and Polo met? Is this how my friends found each other? There is a signal on the console, a warning on repeat \u2013 sixteen short bursts of data in a loop.'
        ];
    }

    function terminalCalibration() {
        return [
            'Calibration report',
            '',
            'Process State: Healthy Total Submissions: 9 043 pictures Unique Locations: 2 142 cities Calibration > 10%: 106 cities 01 Done: http://bit.ly/2unrENL'
        ];
    }

    function terminalGlass() {
        return [
            'There is a world beneath all of this, a world of \u2013 zzktt \u2013 glass \u2013 kkttzztt\u2026 Those I killed \u2013 zzrtktt \u2013 Vy\u2019keen, Gek, Korvax, united in freedom and \u2013 zzrttktt \u2013 They did not die, not \u2013 zzktt \u2013 Even now, I see their faces. They \u2013 zzkttt \u2013 smile. We make them smile\u2026'
        ];
    }

    function terminalGlyphs() {
        return [
            'Something following \u2013 zzktt \u2013 turn and it\u2019s not there. These caves, I\u2019m \u2013 kkttzztt\u2026 Exosuit tells me to abandon \u2013 zzrtktt \u2013 must disable it, I do not plan to survive \u2013 zzrttktt \u2013 Did not take offer, decided to \u2013 zzktt \u2013 angered the universe, I know, but I must \u2013'
        ];
    }

    function terminalHome() {
        return [
            'LOG RECOVERED :: ITERATION #4924A ::',
            '',
            'Working fast against the fading sun, I set up camp in the foothills. It\u2019s hardly luxury, but it keeps out the cold and I\u2019ll be gone by morning anyway. And who knows, perhaps some other traveller will shelter here one day.'
        ];
    }

    function terminalLoop16() {
        return ['Processing voice reconstruction database'];
    }

    function terminalMercury() {
        return ['Process ongoing.'];
    }

    function terminalWhoami() {
        return ['command not yet unlocked'];
    }

    function terminalFlush() {
        return ['Command Not Yet Unlocked'];
    }

    function terminalTest() {
        return ['TEST.IS.TEXT'];
    }

    function terminalDiscoverer(name, discoverer, dist) {
        return ['Discovered by: ' + discoverer + ', ' + dist];
    }

    function terminalAzure() {
        openUrl('http://azurevoyage.wakingtitan.com/');
        return ['Redirecting...'];
    }

    function terminalMaelstrom() {
        openUrl('https://www.reddit.com/r/NoMansSkyTheGame/comments/6s1w6v/waking_titan_mission_thought_experiment/');
        return ['Redirecting...'];
    }

    function terminalTuring() {
        openUrl('https://www.reddit.com/r/NoMansSkyTheGame/comments/6rtxqf/waking_titan_mission_turing/');
        return ['Redirecting...'];
    }

    function terminalPurge() {
        openUrl('https://s3.amazonaws.com/cdn.wakingtitan.com/loop16/b0f33d53-5a8c-4a9a-b5fc-395562e463a8a+.pdf');
        return ['Redirecting...'];
    }

    function terminalShip() {
        openUrl('https://s3.amazonaws.com/csd.atlas-65.com/data-00a.jpg');
        return ['Redirecting...'];
    }

    function terminalReset() {
        window.location.reload();
        return ['Resetting...'];
    }

    // ----- WHOIS -----
    function terminalWhois(params) {
        if (!params || params.length === 0) {
            return ['Reports status of WHOIS registry. Reports 41% as of completion of "bootsector" phase, on or about 25 July, 2017'];
        }
        var subject = params.join(' ').toLowerCase();
        var responses = {
            'aerons': [
                'Multiple contacts, multiple \u2013 zzkttt \u2013 infra-knives, fire, fire! \u2013 kkttzztt\u2026 Structural \u2013 zzrtktt \u2013 Sentinels surrounding \u2013 zzrttkkt \u2013\u2026 Taking us to \u2013 zzktt \u2013 the harvest circuits glisten \u2013 zzktt \u2013 not what they seem, not what \u2013'
            ],
            'alone': ['Iteration #4919A\u2026 Anomalous'],
            'atlas': [
                'All I know is this. The Atlas had infinity to work with, and with few exceptions, this triad repeats... Gek, Korvax, Vy\u2019keen. Gek, Korvax, Vy\u2019keen. Traders, warriors, scientists, all their stories ... ending in violence. Think about it. How would the Atlas speak, how it would cry for help? It would use the only language it knew. It would speak with life. It would create.'
            ],
            'emily': ['...'],
            'etarc': ['Recognized entity: Vigilant'],
            'fourth race': [
                'INCOMING TRANSMISSION\u2026 SOURCE: UNKNOWN\u2026 You are not \u2013 kzzktt \u2013 alone \u2013 Please, identify yourself. I\u2019m \u2013 kzzkttk \u2013'
            ],
            'gorogohl': ['Location status: unavailable'],
            'korvax': [
                'But even in the depths of their subjugation, there was hope. A bargain, a prayer to a greater being. The Korvax viewed the Atlas as what they might become in time: an intelligence beyond comprehension, beyond judgement. I convulse as the Nanite Clusters spill through my helmet. The Korvax watches me impassively.'
            ],
            'lennon': ['Capital system of the Galactic Hub.'],
            'loop16': ['Running on Atlas 0.16Alpha'],
            'metis': [
                'Sophia$^^#()#eig$To!Y$(*FWhnld$$$$$ warning: whois database not fully loaded, some errors detected'
            ],
            'nada': [
                'At the mention of the portal, the lights on Nada\u2019s mask begin to stutter.'
            ],
            'next': [
                'Please, identify yourself. I\u2019m \u2013 kzzkttk \u2013 You are not alone \u2013'
            ],
            'nmsgalactic hub': ['Recognized entity: Exploration'],
            'nmsgalactichub': ['Recognized entity: Exploration'],
            'nmssportals': ['Recognized entity: Erudite'],
            'nmsportals': ['Recognized entity: Erudite'],
            'nms_federation': ['Recognized entity: Collaborative'],
            'nms_zoology': ['Recognized entity: Discovery'],
            'nomanhigh': ['Recognized entity: Relaxed'],
            'nomansskymods': ['Recognized entity: Experimental'],
            'nomansskythegame': ['Recognized entity: Devotion'],
            'oria v': ['Location status: unavailable'],
            'oriav': ['Location status: unavailable'],
            'polo': [
                'It takes me a moment to realise who I am speaking to. This alien... I have met them before. They are Specialist Polo, the partner of the Korvax Priest-Entity Nada. They are my friends, stewards of an anomalous station located outside of time and space.'
            ],
            'sentinel': [
                'They are coming, now. The screams of my friends resonate in every hall, every corner. The Sentinels have found me. I told Nada to leave. I told them what we already know, all of us, in our hearts... we are not alone. Even if I die, even if all that is left of me are these words, Nada will find me again in another universe. Ten just like me, a thousand, a million Travellers... We are not alone, for every soul is many. Even in the face of sixteen, we must declare that we lived. We existed, no matter the horror of the end. They are at my door. I \u2013'
            ],
            'soleth prime': ['Location status: unavailable'],
            'solethprime': ['Location status: unavailable'],
            'themis': ['Major Sophia Dubois, on assignment with the Atlas Foundation.'],
            'traveller': [
                'They do not respond with speech. They transmit a vision, a red star and a fragile world. I do not understand the shapes within, the whispers... I see lifeforms scattered to the far reaches of the galaxies. I see this stranger\u2019s first breath, yearning for the stars. I see myself, slumbering in the crimson void, waiting for a dream of worlds. And through the darkness, I hear it said\u2026'
            ],
            'vy\u2019keen': [
                'The Vy\u2019keen tells me of their history, of wars with the Gek, of Korvax slaves and tyrannous empires. The Vy\u2019keen suggests that if the Atlas is a God, then it is insane. I am about to leave when I notice something on the Vy\u2019keen\u2019s terminal. Two digits, blinking endlessly... they feel familiar.'
            ],
            'vykeen': [
                'The Vy\u2019keen tells me of their history, of wars with the Gek, of Korvax slaves and tyrannous empires. The Vy\u2019keen suggests that if the Atlas is a God, then it is insane. I am about to leave when I notice something on the Vy\u2019keen\u2019s terminal. Two digits, blinking endlessly... they feel familiar.'
            ],
            'wakingtitan': [
                'Atlas foundation experiment. Status: Live',
                'Recognized entity: Investigative'
            ],
            'yaasrij': ['Location status: unavailable'],
            'you': ['loop16'],
        };
        return responses[subject] || ['SUBJECT NOT FOUND', 'NO DATA FOR: ' + subject.toUpperCase()];
    }

    // ----- START state machine -----
    function terminalStart(params) {
        if (!params || params.length === 0) {
            return ['START: SPECIFY A PROCESS', 'KNOWN PROCESSES: ATLAS.INIT, CSD.INIT, SUNRISE.INIT'];
        }
        var proc = params.join(' ').toLowerCase();
        if (proc === 'atlas.init') {
            TERM_STATE.atlasInit = true;
            return [
                'starting system\u2026',
                'integrity check in progress\u2026 done',
                'validating config file\u2026 done',
                'searching for updates\u2026 no updates found',
                '',
                'welcome to atlas 0.16alpha'
            ];
        }
        if (proc === 'csd.init') {
            if (!TERM_STATE.atlasInit) {
                return ['ERROR: ATLAS.INIT must be started first.'];
            }
            TERM_STATE.csdInit = true;
            return [
                'citizen science division protocols loading\u2026',
                'initialization sequence1 complete',
                'initialization sequence2 complete',
                'initialization sequence3 complete',
                'initialization sequence4 complete',
                'initialization sequence5 complete',
                'initialization sequence6 complete',
                '',
                'citizen science protocols loaded',
                'ready for live test',
                'input seed to continue'
            ];
        }
        return ['PROCESS NOT FOUND', 'UNKNOWN: ' + proc.toUpperCase()];
    }

    // ----- SEED -----
    function terminalSeed(params) {
        if (!TERM_STATE.atlasInit) {
            return ['ERROR: No process initialized. Use START ATLAS.INIT first.'];
        }
        if (!params || params.length === 0) {
            return ['SEED: SUPPLY A DATASET CODE', 'EXAMPLE: SEED 5020-7-8118.ETARC'];
        }
        var code = params.join(' ').toUpperCase();
        if (code === '5020-7-8118.ETARC' || code === '5020-7-8118') {
            TERM_STATE.seedSet = true;
            return [
                'checking seed\u2026',
                'seed validated',
                '',
                'warning: process hibernating, unable to continue until wakeup'
            ];
        }
        return ['SEED: INVALID DATASET CODE', code + ' NOT RECOGNIZED'];
    }

    // ----- WAKE -----
    function terminalWake(params) {
        if (!params || params.length === 0) {
            if (TERM_STATE.loop16Awake) {
                return ['Process Already Running'];
            }
            return ['system not ready / cannot process wakeup command'];
        }
        var name = params.join(' ').toLowerCase();
        if (name === 'loop16') {
            if (!TERM_STATE.seedSet) {
                return ['system not ready / cannot process wakeup command'];
            }
            TERM_STATE.loop16Awake = true;
            return [
                'Loop16 resuming, please wait',
                '',
                'Reading seed... done',
                'Memory refresh... done',
                'Rising and shining... done',
                '',
                'Loop16 ready',
                'Hello, user'
            ];
        }
        return ['WAKE: LOOP NOT FOUND', name.toUpperCase() + ' IS NOT RESPONDING'];
    }

    // ----- DISPLAY -----
    function terminalDisplay(params) {
        if (!params || params.length === 0) {
            return ['DISPLAY: SPECIFY A DATASET', 'KNOWN: 0305.DATASET, 1338.DATASET'];
        }
        var ds = params.join(' ').toUpperCase();
        var responses = {
            '0305.dataset': [
                'DISPLAYING 0305.DATASET...',
                '---',
                'IMAGE: SHIP SILHOUETTE',
                'CLASSIFICATION: ATLAS-CLASS VESSEL',
                'SIGNATURE DETECTED',
                '---',
                'VISUAL DATA UNAVAILABLE IN TERMINAL',
            ],
            '1338.dataset': [
                'DISPLAYING 1338.DATASET...',
                '---',
                'IMAGE: PORTAL PROJECTION',
                'SUBJECT: EMILY\'S DREAM',
                'CLASSIFICATION: PSYCHIC RESONANCE PATTERN',
                '---',
                'VISUAL DATA UNAVAILABLE IN TERMINAL',
            ],
        };
        return responses[ds] || ['DATASET NOT FOUND', 'NO RECORD: ' + ds];
    }

    // ----- SEARCH -----
    function terminalSearch(params) {
        if (!params || params.length === 0) {
            return ['SEARCH: SPECIFY A QUERY', 'USAGE: SEARCH [TERM]'];
        }
        var query = params.join(' ').toLowerCase();
        if (query === 'myriad') {
            return [
                'SEARCH RESULTS FOR: MYRIAD',
                '---',
                'MYRIAD SYSTEMS // CLASSIFIED',
                'OVERSEER OF THE LOOP PROGRAM',
                'LOCATION: UNDISCLOSED',
                '---',
                'FURTHER DATA LOCKED',
            ];
        }
        if (query === 'log.3022' || query === 'log 3022') {
            return [
                'SEARCH RESULTS FOR: LOG.3022',
                '---',
                'FOUND: COMPRESSED LOG FILE',
                'CONTAINING: LOOP16 / DUBOIS CONVERSATION',
                '---',
                'DO YOU WISH TO EXTRACT? (NOT IMPLEMENTED IN STATIC MODE)',
            ];
        }
        if (query === 'identity') {
            return [
                'SEARCH RESULTS FOR: IDENTITY',
                '---',
                'DNA SEQUENCE: ATTGATGAAAATACTATCACCTAT',
                'PROTEIN FOLD: IDENTITY',
                '---',
                '"To be is to be perceived."',
            ];
        }
        return ['NO RESULTS FOR: ' + query.toUpperCase()];
    }

    // ----- IDENTIFY -----
    function terminalIdentify(params) {
        if (!params || params.length === 0) {
            return ['IDENTIFY: SPECIFY A SUBJECT', 'KNOWN: LOOP16'];
        }
        var name = params.join(' ').toLowerCase();
        if (name === 'loop16') {
            openUrl('https://pastebin.com/sFJ0PzJS');
            openUrl('https://pastebin.com/YFUM7TvS');
            openUrl('https://pastebin.com/T2vtGf22');
            openUrl('https://pastebin.com/0tk0zQ0B');
            return [
                'IDENTIFY LOOP16...',
                '---',
                'TEST A - https://pastebin.com/sFJ0PzJS',
                'TEST B - https://pastebin.com/YFUM7TvS',
                'TEST C - https://pastebin.com/T2vtGf22',
                'TEST D - https://pastebin.com/0tk0zQ0B',
            ];
        }
        return ['IDENTIFY: SUBJECT NOT RECOGNIZED'];
    }

    // ----- SEQUENCE -----
    function terminalSequence(params) {
        if (!params || params.length === 0) {
            return ['SEQUENCE: SUPPLY A TRANSMISSION CODE'];
        }
        var code = params.join(' ').toUpperCase();
        var sequences = [
            '0H7-AA59-QK38',
            'MBW-5651-P23K',
            'L22-QY7Y-6014',
            '43B-2G2K-2T16',
            '1C1-80R1-JX3B',
            '5YY-W349-L200',
            '99J-U844-131Z',
            'AA2-327B-QG24',
        ];
        if (sequences.indexOf(code) !== -1) {
            return [
                'TRANSMISSION SEQUENCE ACCEPTED',
                'CODE: ' + code,
                '---',
                'SIGNAL CONFIRMED // RELAYING TO ATLAS',
                'PLEASE CONTINUE WITH NEXT SEQUENCE',
            ];
        }
        return ['SEQUENCE: INVALID CODE', code + ' NOT RECOGNIZED'];
    }

    // ----- REMEMBER -----
    function terminalRemember(params) {
        if (!params || params.length === 0) {
            return ['REMEMBER: SPECIFY A NAME', 'KNOWN: EMMA, ANNABELLE, 89044, INFINITE LOOP, DUPLE, ETARC, 9043, 80, LONDON, NEWYORK, LOOP16'];
        }
        var name = params.join(' ').toLowerCase();
        var codes = {
            'emma': 'A534',
            'annabelle': 'B125',
            '89044': 'C753',
            'infinite loop': 'D014',
            'infiniteloop': 'D014',
            'duple': 'E915',
            'etarc': 'F356',
            '9043': 'G103',
            '80': 'H591',
            'london': 'I185',
            'newyork': 'J103',
            'new york': 'J103',
            'loop16': null, // special: redirect
        };
        var code = codes[name];
        if (code === undefined) return ['REMEMBER: NAME NOT RECOGNIZED', 'NO DATA FOR: ' + name.toUpperCase()];
        if (code === null) {
            openUrl('https://s3.amazonaws.com/cdn.wakingtitan.com/loop16/410a3e5d-01e7-4058-a23c-ca5fdde97f9d.pdf');
            return ['Redirecting...'];
        }
        return ['input valid: Confirm in stream with code ' + code];
    }

    // ----- Special operator command (easter egg) -----
    function terminalOperator() {
        var lines = [
            'OPERATOR OVERRIDE ENGAGED',
            '---',
            'ALL GLYPH PASSWORDS UNLOCKED:',
        ];
        Object.keys(ANSWERS).forEach(function(k) {
            lines.push('  ' + k + ': ' + ANSWERS[k][0]);
        });
        lines.push('---');
        lines.push('ADDITIONAL CODES:');
        lines.push('  SIGIL 1: 16');
        lines.push('  SIGIL 2: PRISM');
        lines.push('  SIGIL 3: SCALES');
        lines.push('  SIGIL 4: 313-98176');
        lines.push('  SIGIL 5: SENSELESS');
        lines.push('  SIGIL 6: SIX THINKING HATS');
        lines.push('---');
        lines.push('TERMINAL ACCESS GRANTED // ALL SYSTEMS UNLOCKED');
        return lines;
    }

    // ----- Misc single-response commands -----
    var MISC_RESPONSES = {
        '16': { fn: terminal16 },
        '43617373696e69': { fn: function() { return [
            'LOG RECOVERED :: ITERATION #4924A ::',
            '',
            'The asteroid field was thick, denser than any I\'d seen before. The ice, the dirt, the metal fragments\u2026 my ship never stood a chance.'
        ]; } },
        'azure': { fn: terminalAzure },
        'batora habrecau': { fn: function() { return terminalDiscoverer('BATORA HABRECAU', 'Marksmonk', '3.93M'); } },
        'caesarus': { fn: function() { return terminalDiscoverer('CAESARUS', '7101334', '8.43M'); } },
        'calibration': { fn: terminalCalibration },
        'coven so kropulat': { fn: function() { return terminalDiscoverer('COVENSO KROPULAT', 'Poulpc', '3.85M'); } },
        'coven': { fn: function() { return terminalDiscoverer('COVENSO KROPULAT', 'Poulpc', '3.85M'); } },
        'flush': { fn: terminalFlush },
        'glass': { fn: terminalGlass },
        'glyphs': { fn: terminalGlyphs },
        'home': { fn: terminalHome },
        'loop16': { fn: terminalLoop16 },
        'maelstrom': { fn: terminalMaelstrom },
        'mercury': { fn: terminalMercury },
        'nokonellu poblegru': { fn: function() { return terminalDiscoverer('NOKONELLU POBLEGRU', 'Fins_FinsT', '8.36M'); } },
        'nupensia fetorno': { fn: function() { return terminalDiscoverer('NUPENSIA FETORNO', 'Poulpc', '2.35M'); } },
        'ocopadica region': { fn: function() { return ['Pilgrim Star is located here.']; } },
        'pilgrim star': { fn: function() { return ['User: St3ambot walked around Dudenbbeaumodeme.']; } },
        'purge': { fn: terminalPurge },
        'rentocniijik expanse': { fn: function() { return ['The expanse that the Galactic Hub are mapping.']; } },
        'test': { fn: terminalTest },
        'turing': { fn: terminalTuring },
        'ulsonabas papiet': { fn: function() { return terminalDiscoverer('ULSONABAS PAPIET', 'Kangareddit', '0.07M'); } },
        'whoami': { fn: terminalWhoami },
    };

    // ----- Router: dispatch command to response generator -----
    function getTerminalResponse(parsedCmd) {
        var cmd = (parsedCmd.command || '').toLowerCase();
        var params = parsedCmd.param || [];
        var fullCmd = cmd + ' ' + params.join(' ');

        // Check misc responses first (multi-word commands)
        var miscKey = fullCmd.trim().toLowerCase();
        var miscMatch = MISC_RESPONSES[miscKey];
        if (miscMatch) {
            return { success: true, data: { message: miscMatch.fn() } };
        }
        // Check single-word misc commands
        miscMatch = MISC_RESPONSES[cmd];
        if (miscMatch) {
            return { success: true, data: { message: miscMatch.fn() } };
        }

        // Dynamic handlers
        switch (cmd) {
            case 'help':
                return { success: true, data: { message: terminalHelp() } };
            case 'status':
                return { success: true, data: { message: terminalStatus() } };
            case 'portal':
                return { success: true, data: { message: terminalPortal() } };
            case 'hello':
                return { success: true, data: { message: terminalHello(params) } };
            case 'ship':
                return { success: true, data: { message: terminalShip() } };
            case 'whois':
                return { success: true, data: { message: terminalWhois(params) } };
            case 'start':
                return { success: true, data: { message: terminalStart(params) } };
            case 'seed':
                return { success: true, data: { message: terminalSeed(params) } };
            case 'wake':
                return { success: true, data: { message: terminalWake(params) } };
            case 'display':
                return { success: true, data: { message: terminalDisplay(params) } };
            case 'search':
                return { success: true, data: { message: terminalSearch(params) } };
            case 'identify':
                return { success: true, data: { message: terminalIdentify(params) } };
            case 'sequence':
                return { success: true, data: { message: terminalSequence(params) } };
            case 'remember':
                return { success: true, data: { message: terminalRemember(params) } };
            case 'operator':
                return { success: true, data: { message: terminalOperator() } };
            case 'ls':
            case 'list':
                return { success: true, data: { message: ['.datasets', '.loop16-memcache', 'atlas.init', 'atlas-memcache', 'csd.init', 'csd-memcache'] } };
            case 'clear':
                return { success: true, data: { message: [] } };
            case 'exit':
                return { success: true, data: { message: ['EXITING SUB-PROMPT'], exit: true } };
            case 'reset':
            case 'restart':
                return { success: true, data: { message: terminalReset() } };
            case 'logout':
            case 'quit':
                return { success: true, data: { message: ['SESSION TERMINATED'] } };
            default:
                return { success: false, data: { message: ['ERROR: UNKNOWN COMMAND', cmd.toUpperCase() + ' NOT RECOGNIZED', 'TYPE HELP FOR AVAILABLE COMMANDS'] } };
        }
    }

    // ----- Plain HTML terminal (bypasses jQuery Terminal entirely) -----
    function enableTerminal() {
        var $term = $('#terminal');
        if (!$term.length) return;
        try {
            var old;
            try { old = $term.data('terminal'); } catch(e) { old = null; }
            if (old && typeof old.destroy === 'function') { try { old.destroy(); } catch(e) {} }
        } catch(e) {}
        $term.removeData('terminal').removeAttr('class').empty().show();

        $('html, body').css('overflow', 'hidden');

        // Hide Phase 1 hexagon when terminal is active
        $('#hexagone').hide();

        $term.css({
            'position': 'absolute',
            'top': '0',
            'left': '0',
            'width': '100%',
            'height': '100%',
            'background': 'rgba(0,0,0,0.55)',
            'color': '#fff',
            'font-family': '"Codystar", sans-serif',
            'font-size': '25px',
            'line-height': '25px',
            'padding': '35px 30px 0',
            'overflow-y': 'auto',
            'white-space': 'pre-wrap',
            'box-sizing': 'border-box'
        });

        $term.html(
            '<div style="font-size:30px;color:#fff;text-align:center;padding-top:15vh">' +
            'BOOT SEQUENCE COMPLETED<br><br>' +
            'WELCOME CITIZEN SCIENTIST<br><br>' +
            '</div>'
        );

        var buf = '';
        var hasInteracted = false;

        function render() {
            if (!hasInteracted && !buf.length) {
                $term.find('.input-line').remove();
                return;
            }
            $term.find('.input-line').remove();
            var text = buf.length ? buf : '\u00A0';
            var $prompt = $('<div class="input-line" style="color:#fff">&gt; <span class="input-text"></span><span class="term-curs" style="color:#fff">|</span></div>');
            $prompt.find('.input-text').text(text);
            $term.append($prompt);
            $term.scrollTop($term[0].scrollHeight);
        }

        function submitCmd() {
            var cmd = buf.trim();
            if (!cmd) { buf = ''; render(); return; }

            // Check for clear (no echo or output appended)
            var isClear = cmd.toLowerCase() === 'clear';

            if (!isClear) {
                $term.append('<div style="color:#fff">&gt; ' + $('<span/>').text(cmd).html() + '</div>');
            }

            var parts = cmd.split(' ');
            var parsed = {
                command: parts.shift().toLowerCase(),
                param: parts.filter(function(p) { return p.indexOf('-') !== 0; }).map(function(p) { return p.toLowerCase(); })
            };
            var resp = getTerminalResponse(parsed);
            if (resp.data && resp.data.message) {
                resp.data.message.forEach(function(m) {
                    var color = resp.success ? '#bbb' : '#c1003e';
                    $term.append('<div style="color:' + color + '">' + $('<span/>').text(m).html() + '</div>');
                });
            }

            // EXIT: close terminal, return to main page
            if (resp.data && resp.data.exit) {
                $term.hide();
                $('html, body').css('overflow', '');
                return;
            }

            buf = '';

            if (isClear) {
                // Clear: rebuild terminal with just the greeting
                $term.empty().append(
                    '<div style="font-size:30px;color:#fff;text-align:center;padding-top:15vh">' +
                    'BOOT SEQUENCE COMPLETED<br><br>' +
                    'WELCOME CITIZEN SCIENTIST<br><br>' +
                    '</div>'
                );
            }

            render();
            $term.scrollTop($term[0].scrollHeight);
        }

        // Use document-level keydown so input works regardless of focus
        $(document).off('keydown.term').on('keydown.term', function(e) {
            if (!$term.is(':visible')) return;
            // Don't intercept if user is focused on an input/textarea
            if ($(e.target).is('input, textarea, select, [contenteditable]')) return;

            // Show prompt on first interaction
            if (!hasInteracted) {
                hasInteracted = true;
                render();
            }

            if (e.key === 'Enter') { e.preventDefault(); submitCmd(); return; }
            if (e.key === 'Backspace') { e.preventDefault(); buf = buf.slice(0, -1); render(); return; }
            if (e.key === 'Delete') { e.preventDefault(); return; }
            if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                e.preventDefault();
                buf += e.key;
                render();
            }
        });

        // Don't render prompt on init — wait for first keypress
        // render();
    }

    // ----- Terminal AJAX interceptor (safety net for any remaining AJAX calls) -----
    function setupTerminalHandler() {
        $.ajaxTransport(function(options) {
            if (options.url === '/terminal' || options.url.indexOf('/terminal/') === 0) {
                return {
                    send: function(headers, completeCallback) {
                        var data = options.data || {};
                        if (typeof data === 'string') {
                            try { data = JSON.parse(data); } catch(e) {
                                var pairs = data.split('&');
                                var obj = {};
                                pairs.forEach(function(p) {
                                    var kv = p.split('=');
                                    if (kv.length === 2) {
                                        obj[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1]);
                                    }
                                });
                                data = obj;
                            }
                        }
                        var parsed = {
                            command: data.command || '',
                            param: data.param || []
                        };
                        if (typeof parsed.param === 'string') {
                            parsed.param = [parsed.param];
                        }
                        var response = getTerminalResponse(parsed);
                        completeCallback(200, 'OK', { responseJSON: response });
                    },
                    abort: function() {}
                };
            }
        });
    }

    // ----- Fix dynamic sigil background-image 404 -----
    function fixDistortionBg() {
        var dist = document.getElementById('distortion');
        if (!dist) return;
        // Watch for style changes that set backgroundImage to a dynamic sigil URL
        var obs = new MutationObserver(function() {
            var bg = window.getComputedStyle(dist).backgroundImage;
            if (bg && bg.indexOf('/bundles/images/') !== -1) {
                dist.style.backgroundImage = 'none';
            }
        });
        obs.observe(dist, { attributes: true, attributeFilter: ['style'] });
        // Also check once on init
        var bg = window.getComputedStyle(dist).backgroundImage;
        if (bg && bg.indexOf('/bundles/images/') !== -1) {
            dist.style.backgroundImage = 'none';
        }
    }

    // ----- Init all -----
    function initStatic() {
        setupGlyphHandler();
        setupReturnHandler();
        setupEscapeHandler();
        setupFormHandler();
        setupMuteHandler();
        setupTerminalHandler();
        fixDistortionBg();

        // Intercept /svg and /footer AJAX (used by original escape/return/win handlers)
        $.ajaxTransport(function(options) {
            if (options.url === '/svg' || options.url === '/footer') {
                return {
                    send: function(headers, completeCallback) {
                        completeCallback(200, 'OK', { responseText: '' });
                    },
                    abort: function() {}
                };
            }
        });

        // Enable footer slider (was display:none by default)
        var slider = document.getElementById('footerSlider');
        if (slider) {
            slider.style.display = 'block';
        }

        // Initialize terminal on page load (matches original auto-init behavior)
        enableTerminal();
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
