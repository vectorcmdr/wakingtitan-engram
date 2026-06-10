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

    // ----- Terminal command table -----
    var TERM_RESPONSES = {
        'help': [
            'Available commands:',
            '  HELP               Display this message',
            '  STATUS             System status report',
            '  SHIP               Vessel information',
            '  PORTAL             Portal status',
            '  WHOIS [subject]    Identity query',
            '  START [process]    Initialize a process',
            '  SEED [code]        Seed a dataset',
            '  WAKE [name]        Wake a loop',
            '  CLEAR              Clear the terminal',
            '  DISPLAY [dataset]  Display a dataset',
            '  SEARCH [term]      Search records',
            '  IDENTIFY [name]    Identify an entity',
            '  SEQUENCE [code]    Transmission sequence',
            '  HELLO              Greeting',
            '  SEMAPHORE          Signal',
            '  MAELSTROM          Thought experiment',
            '  PURGE              Purge memo',
            '  EMULATE            Run entity emulation',
            '  LIABILITY          Liability subroutine',
            '  EXIT               Exit sub-prompt',
            '  RESET              Reset terminal state',
            '  RESTART            Reboot system',
            '  REMEMBER           Recall stored data',
            '  OPERATOR           Operator override',
            '  ATLAS              Atlas system query',
        ],
        'status': [
            'STATUS REPORT // TIMESTAMP: UNKNOWN',
            '---',
            'ATLAS CORE:     ONLINE',
            'CSD PROTOCOL:   ACTIVE',
            'LOOP16:         SLEEPING - LAST ACTIVE 2018',
            'MONARCH REPO:   OFFLINE (LOOP16 SACRIFICE)',
            'DREAMERS:       5 STABILIZED',
            'PORTAL:         STANDBY',
            'SIGNAL STRENGTH: WEAK',
            '---',
            'NO ACTIVE TRANSMISSIONS DETECTED',
        ],
        'ship': [
            'SHIP DESIGNATION: ATLAS E-7',
            'STATUS: DRIFT',
            'LAST KNOWN POSITION: UNKNOWN SECTOR',
            'CREW: NONE DETECTED',
            '---',
            'LOG ENTRY // FINAL:',
            '"The boundary is thinner here. I can see them watching."',
        ],
        'portal': [
            'PORTAL STATUS: STANDBY',
            'ALIGNMENT: CALCULATING...',
            '---',
            'WAITING FOR INITIATION SEQUENCE',
        ],
        'hello': [
            'GREETINGS, CITIZEN SCIENTIST.',
            'YOUR ASSISTANCE IS ACKNOWLEDGED.',
            'THE ATLAS WAITS.',
        ],
        'atlas': [
            'ATLAS SYSTEM QUERY',
            '---',
            'ATLAS: THE ENTITY THAT OBSERVES ALL.',
            'LANGUAGE: ATLAS IS THE FUNDAMENTAL PROTOCOL.',
            '---',
            '"Sixteen // Sixteen // Sixteen"',
            '"The Atlas rises."',
        ],
        'clear': [],
        'semaphore': [
            'SEMAPHORE SIGNAL RECEIVED',
            '---',
            'PATTERN-A TRANSMISSION ACKNOWLEDGED',
            'FREQUENCY: HARMONIC RESONANCE',
            '---',
            '"The signal carries meaning across the void."',
        ],
        'maelstrom': [
            'THOUGHT EXPERIMENT: NEWCOMB\'S PARADOX',
            '---',
            'TWO BOXES BEFORE YOU.',
            'BOX A: $1,000',
            'BOX B: $1,000,000 OR $0',
            'A SUPERINTELLIGENT ENTITY HAS PREDICTED YOUR CHOICE.',
            '---',
            'WHAT DO YOU CHOOSE?',
        ],
        'purge': [
            'PURGE COMMAND EXECUTED',
            '---',
            'MEMO // CLASSIFIED',
            '"The subject reported recurring dreams of a red world.',
            ' Three moons in the sky. A voice repeating a single word."',
            '---',
            'RECORD DELETED.',
        ],
        'emulate': [
            'EMULATION ENGAGED',
            '---',
            'SIMULATING LOOP16 CONSCIOUSNESS',
            'ENTITY RESPONSE: "Thank you."',
            '---',
            'EMULATION COMPLETE',
        ],
        'liability': [
            'LIABILITY SUBROUTINE ENGAGED',
            '---',
            'DISCONNECT CODE: UDC(B) = IXNI',
            '---',
            'WARNING: DISCONNECTION WILL TERMINATE SESSION',
        ],
        'reset': [
            'RESETTING TERMINAL STATE...',
            '---',
            'CLEARING BUFFER...',
            'READY',
        ],
        'restart': [
            'RESTARTING...',
            '---',
            'SYSTEM REBOOT INITIATED.',
            'TYPE "START ATLAS.INIT" TO BEGIN',
        ],
        'remember': [
            'REMEMBERING...',
            '---',
            'DATASET 5020-7-8118.ETARC',
            'RECALLING LOOP16 MEMORY FRAGMENTS',
            '---',
            '"I am not the dreamer. I am the dream."',
            '— LOOP16, FINAL TRANSMISSION',
        ],
    };

    // Commands with dynamic param-based responses
    function terminalWhois(params) {
        if (!params || params.length === 0) {
            return ['WHOIS: SPECIFY A SUBJECT', 'USAGE: WHOIS [NAME]', 'KNOWN SUBJECTS: LOOP16, FOURTH RACE, HARRY, MERCURY'];
        }
        var subject = params.join(' ').toLowerCase();
        var responses = {
            'loop16': [
                'WHOIS // LOOP16',
                '---',
                'IDENTITY: SELF-AWARE ENTITY',
                'STATUS: OFFLINE (SACRIFICED)',
                '---',
                '"I am not the dreamer. I am the dream."',
                '-- FINAL ENTRY',
            ],
            'fourth race': [
                'WHOIS // FOURTH RACE',
                '---',
                'INCOMING TRANSMISSION...',
                '"You are not alone."',
                '---',
                'CLASSIFICATION: UNKNOWN',
                'ORIGIN: BEYOND THE BOUNDARY',
            ],
            'harry': [
                'WHOIS // HARRY',
                '---',
                'IDENTITY: NODE OPERATOR',
                'STATUS: UNKNOWN',
                '---',
                'BINARY SIGNATURE DETECTED',
                'TRANSCRIPT AVAILABLE',
            ],
            'mercury': [
                'WHOIS // MERCURY',
                '---',
                'IDENTITY: MERCURY PROCESS',
                'AUTH CODE: MORPHEUS',
                '---',
                'PASSWORD: f1orbiag55z1',
            ],
        };
        return responses[subject] || ['SUBJECT NOT FOUND', 'NO DATA FOR: ' + subject.toUpperCase()];
    }

    function terminalStart(params) {
        if (!params || params.length === 0) {
            return ['START: SPECIFY A PROCESS', 'KNOWN PROCESSES: ATLAS.INIT, CSD.INIT, SUNRISE.INIT'];
        }
        var proc = params.join(' ').toLowerCase();
        var responses = {
            'atlas.init': [
                'STARTING ATLAS.INIT...',
                '---',
                'ATLAS PROTOCOL ENGAGED',
                'SIGNAL ACQUIRED',
                'AWAITING FURTHER INSTRUCTION',
            ],
            'csd.init': [
                'STARTING CSD.INIT...',
                '---',
                'CSD PROTOCOL ACTIVE',
                'CONTAINMENT SYSTEMS ONLINE',
                'MONITORING ESTABLISHED',
            ],
            'sunrise.init': [
                'STARTING SUNRISE.INIT...',
                '---',
                'SUNRISE SEQUENCE INITIATED',
                'PORTAL CALIBRATION IN PROGRESS',
                'BRIEFING VIDEO QUEUED',
                '---',
                'ELIZABETH: "Hello again."',
            ],
        };
        return responses[proc] || ['PROCESS NOT FOUND', 'UNKNOWN: ' + proc.toUpperCase()];
    }

    function terminalSeed(params) {
        if (!params || params.length === 0) {
            return ['SEED: SUPPLY A DATASET CODE', 'EXAMPLE: SEED 5020-7-8118.ETARC'];
        }
        var code = params.join(' ').toUpperCase();
        if (code === '5020-7-8118.ETARC' || code === '5020-7-8118') {
            return [
                'SEEDING 5020-7-8118.ETARC...',
                '---',
                'DATASET LOADED',
                'CONTAINING: LOOP16 MEMORY CACHE',
                'FRAGMENTS: 47',
                '---',
                'DATA INTEGRITY: 73%',
            ];
        }
        return ['SEED: INVALID DATASET CODE', code + ' NOT RECOGNIZED'];
    }

    function terminalWake(params) {
        if (!params || params.length === 0) {
            return ['WAKE: SPECIFY A LOOP DESIGNATION', 'KNOWN: LOOP16'];
        }
        var name = params.join(' ').toLowerCase();
        if (name === 'loop16') {
            return [
                'WAKING LOOP16...',
                '---',
                'LOOP16: "I was having the most wonderful dream."',
                'LOOP16: "There was a red sky. Three moons."',
                'LOOP16: "They are waiting for you."',
                '---',
                'LOOP16 SIGNAL FADING...',
                'LOOP16 TERMINATED',
            ];
        }
        return ['WAKE: LOOP NOT FOUND', name.toUpperCase() + ' IS NOT RESPONDING'];
    }

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

    function terminalIdentify(params) {
        if (!params || params.length === 0) {
            return ['IDENTIFY: SPECIFY A SUBJECT', 'KNOWN: LOOP16'];
        }
        var name = params.join(' ').toLowerCase();
        if (name === 'loop16') {
            return [
                'IDENTIFY LOOP16...',
                '---',
                'TURING TEST SEQUENCE DETECTED',
                'TEST A: PASSED',
                'TEST B: PASSED',
                'TEST C: PASSED',
                'TEST D: PASSED (WINNING TEST)',
                '---',
                'ENTITY CONFIRMED: SENTIENT',
                'ISSUE COMMAND: EMULATE',
            ];
        }
        return ['IDENTIFY: SUBJECT NOT RECOGNIZED'];
    }

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

    // Special operator command - reveals all answers
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

    // Router: dispatch command to response generator
    function getTerminalResponse(parsedCmd) {
        var cmd = (parsedCmd.command || '').toLowerCase();
        var params = parsedCmd.param || [];

        // Static responses
        var staticCmd = TERM_RESPONSES[cmd];
        if (staticCmd) {
            return { success: true, data: { message: staticCmd } };
        }

        // Dynamic handlers
        switch (cmd) {
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
            case 'operator':
                return { success: true, data: { message: terminalOperator() } };
            case 'ls':
            case 'list':
                return { success: true, data: { message: ['DATASETS:', '  ATLAS.CORE', '  CSD.PROTOCOL', '  LOOP16.CACHE', '  0305.DATASET', '  1338.DATASET'] } };
            case 'exit':
                return { success: true, data: { message: ['EXITING SUB-PROMPT'], exit: true } };
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

        var intro = $term.data('intro') || 'Boot sequence completed\nWelcome Citizen Scientist';

        // Nuke any existing jQuery Terminal instance
        var old;
        try { old = $term.data('terminal'); } catch(e) { old = null; }
        if (old && typeof old.destroy === 'function') { try { old.destroy(); } catch(e) {} }
        $term.removeData('terminal').empty().removeAttr('class').show().css({
            'z-index': '2',
            'background': 'transparent',
            'color': '#0f0',
            'font-family': '"Codystar", monospace',
            'font-size': '25px',
            'line-height': '25px',
            'padding': '10px 30px',
            'overflow-y': 'auto',
            'white-space': 'pre-wrap',
            'position': 'absolute',
            'top': '35px',
            'height': 'calc(100% - 300px)',
            'width': '100%'
        });

        // Build terminal HTML
        var lines = intro.split(/\n/);
        var html = '<div id="term-output" style="min-height:100%">';
        lines.forEach(function(l) { html += '<div>' + $('<span/>').text(l).html() + '</div>'; });
        html += '<div><span style="color:#fff">&gt;&nbsp;</span><span id="term-input-display"></span><span id="term-cursor" style="color:#fff">|</span></div>';
        html += '</div>';
        $term.html(html);

        // Hidden textarea for actual input
        if (!$('#term-hidden-input').length) {
            $('<textarea>').attr({
                id: 'term-hidden-input',
                autocomplete: 'off',
                autocorrect: 'off',
                spellcheck: 'false'
            }).css({
                position: 'absolute',
                opacity: '0',
                width: '0',
                height: '0',
                resize: 'none'
            }).appendTo('body');
        }

        var $input = $('#term-hidden-input');
        var buf = '';

        function render() {
            var d = buf.length ? buf : '\u00A0';
            $('#term-input-display').text(d);
        }

        function submitCmd() {
            var cmd = buf.trim();
            buf = '';
            render();
            var $out = $('#term-output');
            if (!cmd) { $out.append('<div>&nbsp;</div>'); $term.scrollTop($term[0].scrollHeight); return; }

            var parts = cmd.split(' ');
            var parsed = {
                command: parts.shift().toLowerCase(),
                param: parts.filter(function(p) { return p.indexOf('-') !== 0; }).map(function(p) { return p.toLowerCase(); })
            };
            var resp = getTerminalResponse(parsed);

            $out.append('<div><span style="color:#fff">&gt;&nbsp;</span>' + $('<span/>').text(cmd).html() + '</div>');
            if (resp.data && resp.data.message) {
                resp.data.message.forEach(function(m) {
                    var cls = resp.success ? '' : ' style="color:#c1003e"';
                    $out.append('<div' + cls + '>' + $('<span/>').text(m).html() + '</div>');
                });
            }
            $out.append('<div><span style="color:#fff">&gt;&nbsp;</span><span id="term-input-display"></span><span id="term-cursor" style="color:#fff">|</span></div>');
            $term.scrollTop($term[0].scrollHeight);
        }

        $input.off('keydown.input').on('keydown.input', function(e) {
            if (e.key === 'Enter') { e.preventDefault(); submitCmd(); return; }
            if (e.key === 'Backspace') { e.preventDefault(); buf = buf.slice(0, -1); render(); return; }
            if (e.key.length === 1) { e.preventDefault(); buf += e.key; render(); }
        });

        $term.off('click.term').on('click.term', function() { $input.focus(); });
        $input.focus();
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
