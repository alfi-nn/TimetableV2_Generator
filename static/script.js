document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('timetableForm');
    const classesContainer = document.getElementById('classesContainer');
    const teachersContainer = document.getElementById('teachersContainer');
    const addClassBtn = document.getElementById('addClass');
    const addTeacherBtn = document.getElementById('addTeacher');
    const resultsContainer = document.getElementById('results');
    const themeToggle = document.getElementById('themeToggle');

    // Theme toggle functionality
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            document.body.dataset.theme = document.body.dataset.theme === 'dark' ? '' : 'dark';
            localStorage.setItem('theme', document.body.dataset.theme || 'light');
            
            // Update icon
            const themeIcon = themeToggle.querySelector('.material-symbols-outlined');
            if (themeIcon) {
                themeIcon.textContent = document.body.dataset.theme === 'dark' ? 'light_mode' : 'dark_mode';
            }
        });
        
        // Apply saved theme on load
        const savedTheme = localStorage.getItem('theme') || 'light';
        if (savedTheme === 'dark') {
            document.body.dataset.theme = 'dark';
            const themeIcon = themeToggle.querySelector('.material-symbols-outlined');
            if (themeIcon) {
                themeIcon.textContent = 'light_mode';
            }
        }
    }
    
    // Show export bar when results are displayed
    function showExportBar() {
        const exportBar = document.querySelector('.export-bar');
        if (exportBar) {
            exportBar.classList.add('show');
        }
    }

    // Add new class
    addClassBtn.addEventListener('click', function() {
        const classEntry = document.createElement('div');
        classEntry.className = 'class-entry';
        classEntry.style.opacity = '0';
        classEntry.style.transform = 'translateY(20px)';
        classEntry.innerHTML = `
            <input type="text" placeholder="Class Name" class="class-name">
            <div class="subjects-container">
                <div class="subject-entry">
                    <input type="text" placeholder="Subject Name" class="subject-name">
                    <input type="number" placeholder="Hours" class="subject-hours" min="1">
                    <label class="lab-checkbox">
                        <input type="checkbox" class="is-lab"> Lab Subject
                    </label>
                    <button type="button" class="remove-subject">
                        <span class="material-symbols-outlined">delete</span>
                    </button>
                </div>
            </div>
            <button type="button" class="add-subject">
                <span class="material-symbols-outlined">add</span> Add Subject
            </button>
            <button type="button" class="remove-class">
                <span class="material-symbols-outlined">delete</span> Remove Class
            </button>
        `;
        classesContainer.appendChild(classEntry);
        
        // Animate entry
        setTimeout(() => {
            classEntry.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            classEntry.style.opacity = '1';
            classEntry.style.transform = 'translateY(0)';
        }, 10);
    });

    // Add new teacher
    addTeacherBtn.addEventListener('click', function() {
        const teacherEntry = document.createElement('div');
        teacherEntry.className = 'teacher-entry';
        teacherEntry.style.opacity = '0';
        teacherEntry.style.transform = 'translateY(20px)';
        teacherEntry.innerHTML = `
            <input type="text" placeholder="Teacher Name" class="teacher-name">
            <input type="text" placeholder="Subjects (comma-separated)" class="teacher-subjects">
            <button type="button" class="remove-teacher">
                <span class="material-symbols-outlined">delete</span>
            </button>
        `;
        teachersContainer.appendChild(teacherEntry);
        
        // Animate entry
        setTimeout(() => {
            teacherEntry.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            teacherEntry.style.opacity = '1';
            teacherEntry.style.transform = 'translateY(0)';
        }, 10);
    });

    // Event delegation for dynamic buttons
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('add-subject')) {
            const subjectsContainer = e.target.previousElementSibling;
            const subjectEntry = document.createElement('div');
            subjectEntry.className = 'subject-entry';
            subjectEntry.innerHTML = `
                <input type="text" placeholder="Subject Name" class="subject-name">
                <input type="number" placeholder="Hours" class="subject-hours" min="1">
                <label class="lab-checkbox">
                    <input type="checkbox" class="is-lab"> Lab Subject
                </label>
                <button type="button" class="remove-subject">×</button>
            `;
            subjectsContainer.appendChild(subjectEntry);
        }

        if (e.target.classList.contains('remove-subject')) {
            e.target.parentElement.remove();
        }

        if (e.target.classList.contains('remove-class')) {
            e.target.parentElement.remove();
        }

        if (e.target.classList.contains('remove-teacher')) {
            e.target.parentElement.remove();
        }
    });

    // Form submission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Collect form data
        const formData = {
            periods_per_day: parseInt(document.getElementById('periodsPerDay').value),
            days: Array.from(document.querySelectorAll('input[name="days"]:checked')).map(cb => cb.value),
            class_subjects: {},
            teachers: {}
        };

        // Collect class and subject data
        document.querySelectorAll('.class-entry').forEach(classEntry => {
            const className = classEntry.querySelector('.class-name').value;
            const subjects = {};

            classEntry.querySelectorAll('.subject-entry').forEach(subjectEntry => {
                const subjectName = subjectEntry.querySelector('.subject-name').value;
                const hours = parseInt(subjectEntry.querySelector('.subject-hours').value);
                const isLab = subjectEntry.querySelector('.is-lab').checked;

                if (subjectName && hours) {
                    if (isLab) {
                        subjects[subjectName] = {
                            hours: hours,
                            consecutive: 3
                        };
                    } else {
                        subjects[subjectName] = hours;
                    }
                }
            });

            if (className && Object.keys(subjects).length > 0) {
                formData.class_subjects[className] = subjects;
            }
        });

        // Collect teacher data
        document.querySelectorAll('.teacher-entry').forEach(teacherEntry => {
            const teacherName = teacherEntry.querySelector('.teacher-name').value;
            const subjects = teacherEntry.querySelector('.teacher-subjects').value
                .split(',')
                .map(s => s.trim())
                .filter(s => s);

            if (teacherName && subjects.length > 0) {
                formData.teachers[teacherName] = subjects;
            }
        });

        try {
            const response = await fetch('/generate_timetable', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                displayTimetables(data);
            } else {
                throw new Error(data.error || 'Failed to generate timetable');
            }
        } catch (error) {
            alert(error.message);
        }
    });

    // Display timetables
    function displayTimetables(data) {
        resultsContainer.innerHTML = '';

        for (const className in data) {
            const classDiv = document.createElement('div');
            classDiv.className = 'class-timetable';
            
            // Add class name header
            const classHeader = document.createElement('h2');
            classHeader.textContent = className;
            classDiv.appendChild(classHeader);

            // Create timetable
            const table = document.createElement('table');
            table.className = 'timetable';

            // Add table content
            const tableHTML = data[className].table.map(row => 
                `<tr>${row.map(cell => 
                    row === data[className].table[0] ? 
                    `<th>${cell}</th>` : 
                    `<td>${cell}</td>`
                ).join('')}</tr>`
            ).join('');

            table.innerHTML = tableHTML;
            classDiv.appendChild(table);

            // Add distribution information
            const distributionList = document.createElement('ul');
            distributionList.className = 'distribution-list';
            data[className].distribution.forEach(item => {
                const li = document.createElement('li');
                li.textContent = item;
                distributionList.appendChild(li);
            });
            classDiv.appendChild(distributionList);

            resultsContainer.appendChild(classDiv);
        }
    }

    // Add page transitions
    const linkElements = document.querySelectorAll('.nav-link');
    linkElements.forEach(link => {
        link.addEventListener('click', function(e) {
            if (!this.classList.contains('active')) {
                const container = document.querySelector('.container');
                if (container) {
                    e.preventDefault();
                    container.style.opacity = '0';
                    setTimeout(() => {
                        window.location.href = this.getAttribute('href');
                    }, 300);
                }
            }
        });
    });
    
    // Add transition to CTA button
    const ctaButton = document.getElementById('getStartedBtn');
    if (ctaButton) {
        ctaButton.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = '/generator';
        });
    }
    
    // Enhance feature cards with animation
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 100 * index);
    });
    
    // Drag-and-Drop Functionality
    let draggedItem = null;

    document.querySelectorAll('.draggable-slot').forEach(item => {
        item.addEventListener('dragstart', () => {
            draggedItem = item;
            setTimeout(() => item.style.opacity = '0.5', 0);
        });

        item.addEventListener('dragend', () => {
            setTimeout(() => {
                draggedItem.style.opacity = '1';
                draggedItem = null;
            }, 0);
        });

        item.addEventListener('dragover', e => {
            e.preventDefault();
            const afterElement = getDragAfterElement(e.clientY);
            const container = document.querySelector('.timetable-grid');
            if (afterElement == null) {
                container.appendChild(draggedItem);
            } else {
                container.insertBefore(draggedItem, afterElement);
            }
        });
    });

    function getDragAfterElement(y) {
        const elements = [...document.querySelectorAll('.draggable-slot:not(.dragging)')];
        return elements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            return offset < 0 && offset > closest.offset ? { offset, element: child } : closest;
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    // Export Handlers
    document.getElementById('export-pdf').addEventListener('click', () => {
        html2canvas(document.querySelector('.timetable-grid')).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF();
            pdf.addImage(imgData, 'PNG', 0, 0);
            pdf.save('timetable.pdf');
        });
    });

    document.getElementById('export-csv').addEventListener('click', () => {
        const data = [];
        document.querySelectorAll('.time-slot').forEach(slot => {
            data.push({
                time: slot.querySelector('.time').textContent,
                subject: slot.querySelector('.subject').textContent,
                teacher: slot.querySelector('.teacher').textContent
            });
        });
        const csv = Papa.unparse(data);
        const blob = new Blob([csv], { type: 'text/csv' });
        saveAs(blob, 'timetable.csv');
    });

    // Show loading animation while generating timetable
    if (form) {
        form.addEventListener('submit', function(e) {
            const submitButton = form.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.innerHTML = '<div class="loader-inline"></div> Generating...';
                submitButton.disabled = true;
            }
            
            // Add a loading animation to the results area
            if (resultsContainer) {
                resultsContainer.innerHTML = '<div class="loader"></div><p class="text-center">Generating your timetables...</p>';
            }
        });
    }
});