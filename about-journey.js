// About page: the Journey list. Every row opens its resume bullets in place;
// a case study, when there is one, is a labelled link inside the opened row.
(function () {
    'use strict';

    var list = document.getElementById('selectJourney');
    if (!list) return;

    var JOURNEY = [
        { id: 'skillcat', title: 'Design Engineer', guild: 'SkillCat', years: '2025 to 2026', soft: '#ffb18f',
          href: '/skillcat', hrefLabel: 'Read the SkillCat case study',
          points: ['Defined SkillCat’s product strategy from “certification-first” to a full trades career journey, shaping the roadmap and core experiences to drive longer-term retention and engagement',
                   'Led end-to-end interaction design and development for the redesigned learning journey, collaborating with backend and technical support teams to align user goals and technical constraints',
                   'Built fully functional prototypes in Claude Code for rapid user testing and developed complex product launch and explainer videos using Claude Motion for marketing purposes'] },
        { id: 'scriptchain', title: 'Technical Product Designer', guild: 'ScriptChain Health', years: '2025', soft: '#a9e6e2',
          href: '/scriptchain', hrefLabel: 'Read the ScriptChain case study',
          points: ['Led product design for both patient and provider portals aimed at reducing metabolic syndrome with personalized wellness plans, including prototyping out user flows and motion graphic videos',
                   'Collaborate with machine learning engineers, stakeholders, and patients to balance user flows, ensuring data driven design decisions aligned with medical goals and regulatory requirements'] },
        { id: 'parsons', title: 'M.S. Communication Design', guild: 'Parsons School of Design', years: 'Class of 2025', soft: '#ffb3b0',
          href: '/nocta', hrefLabel: 'Read the Nocta case study',
          text: ['Studied digital product design. Nocta began here as my capstone, then grew into a live beta.'] },
        { id: 'freelance', title: 'Product Designer', guild: 'Freelance', years: '2023 to 2024', soft: '#cdb9ff',
          points: ['Partnered with founders and stakeholders across hospitality, fitness, sports, and healthcare companies to define product goals and deliver end-to-end UX/UI, from research to high-fidelity designs',
                   'Led the website redesign and new brand identity for Resolve Parkinson’s, working directly with the board of directors to translate their research findings and patient stories into a clear, accessible experience'] },
        { id: 'jpm', title: 'Software Engineer', guild: 'JPMorgan Chase', years: '2022', soft: '#a8c8ff',
          points: ['Utilized React and TypeScript to refactor front-end components for the retail Chase web application',
                   'Designed custom privileges and navigations for rendering components using JavaScript, HTML, and CSS',
                   'Collaborated with UX designers to assess design feasibility and improve user flows and interactions'] },
        { id: 'omnicom', title: 'Marketing Analyst', guild: 'Omnicom Media Group', years: '2018 to 2019', soft: '#ffe08a',
          text: ['Analyzed campaign performance data and consumer insights to optimize digital marketing strategies for major brand clients across multiple channels.'] },
        { id: 'ub', title: 'B.S. Business Administration', guild: 'University at Buffalo', years: 'Class of 2018', soft: '#9cc8ff',
          text: ['Studied business before moving into marketing, engineering and design.'] }
    ];

    JOURNEY.forEach(function (ch) {
        var li = document.createElement('li');
        li.style.setProperty('--era-soft', ch.soft);

        var row = document.createElement('button');
        var bodyId = 'journey-' + ch.id;
        row.type = 'button';
        row.className = 'journey-row';
        row.setAttribute('aria-expanded', 'false');
        row.setAttribute('aria-controls', bodyId);
        row.innerHTML = '<b></b><span></span><time></time><i class="journey-toggle" aria-hidden="true"></i>';
        row.children[0].textContent = ch.title;
        row.children[1].textContent = ch.guild;
        row.children[2].textContent = ch.years;

        var body = document.createElement('div');
        body.className = 'journey-body';
        body.id = bodyId;
        var inner = document.createElement('div');
        inner.className = 'journey-inner';
        if (ch.points) {
            var ul = document.createElement('ul');
            ch.points.forEach(function (p) {
                var item = document.createElement('li');
                item.textContent = p;
                ul.appendChild(item);
            });
            inner.appendChild(ul);
        } else {
            ch.text.forEach(function (p) {
                var el = document.createElement('p');
                el.textContent = p;
                inner.appendChild(el);
            });
        }
        if (ch.href) {
            var a = document.createElement('a');
            a.className = 'journey-link';
            a.href = ch.href;
            a.textContent = ch.hrefLabel;
            inner.appendChild(a);
        }
        body.appendChild(inner);

        row.addEventListener('click', function () {
            var open = row.getAttribute('aria-expanded') !== 'true';
            row.setAttribute('aria-expanded', open ? 'true' : 'false');
            li.classList.toggle('is-open', open);
        });
        li.appendChild(row);
        li.appendChild(body);
        list.appendChild(li);
    });
})();
