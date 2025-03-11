document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('timetableForm');
    const classesContainer = document.getElementById('classesContainer');
    const teachersContainer = document.getElementById('teachersContainer');
    const addClassBtn = document.getElementById('addClass');
    const addTeacherBtn = document.getElementById('addTeacher');
    const resultsContainer = document.getElementById('results');
    const themeToggle = document.getElementById('themeToggle');
    const getStartedBtn = document.getElementById('get-started-btn');

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
        classEntry.className = 'class-entry card';
        classEntry.style.opacity = '0';
        classEntry.style.transform = 'translateY(20px)';
        classEntry.innerHTML = `
            <input type="text" placeholder="Class Name" class="class-name">
            <div class="subjects-container">
                <div class="subject-entry">
                    <input type="text" placeholder="Subject Name" class="subject-name">
                    <input type="number" placeholder="Hours" class="subject-hours" min="1">
                    <label class="lab-checkbox">
                        <input type="checkbox" class="is-lab"> 
                        <span class="checkbox-text">Lab Subject</span>
                    </label>
                    <input type="number" placeholder="Consecutive Hours" class="consecutive-hours" min="1" style="display: none;">
                    <button type="button" class="remove-subject">
                        <span class="material-symbols-outlined">delete</span>
                    </button>
                </div>
            </div>
            <div class="button-group">
                <button type="button" class="add-subject">
                    <span class="material-symbols-outlined">add</span> Add Subject
                </button>
                <button type="button" class="remove-class">
                    <span class="material-symbols-outlined">delete</span> Remove Class
                </button>
            </div>
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
        teacherEntry.className = 'teacher-entry card';
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
        // Find the actual button element that was clicked or contains the clicked element
        let button = e.target;
        
        // If clicked on an icon inside the button, get the parent button
        if (e.target.tagName === 'SPAN' && e.target.classList.contains('material-symbols-outlined')) {
            button = e.target.parentElement;
        }
        
        // Handle 'Add Subject' button
        if (button.classList.contains('add-subject')) {
            const classEntry = button.closest('.class-entry');
            const subjectsContainer = classEntry.querySelector('.subjects-container');
            
            const subjectEntry = document.createElement('div');
            subjectEntry.className = 'subject-entry';
            subjectEntry.innerHTML = `
                <input type="text" placeholder="Subject Name" class="subject-name">
                <input type="number" placeholder="Hours" class="subject-hours" min="1">
                <label class="lab-checkbox">
                    <input type="checkbox" class="is-lab"> 
                    <span class="checkbox-text">Lab Subject</span>
                </label>
                <input type="number" placeholder="Consecutive Hours" class="consecutive-hours" min="1" style="display: none;">
                <button type="button" class="remove-subject">
                    <span class="material-symbols-outlined">delete</span>
                </button>
            `;
            subjectsContainer.appendChild(subjectEntry);
        }
        
        // Toggle consecutive hours input visibility based on lab checkbox
        if (button.classList.contains('is-lab')) {
            const consecutiveInput = button.closest('.subject-entry').querySelector('.consecutive-hours');
            consecutiveInput.style.display = button.checked ? 'block' : 'none';
        }
        
        // Handle 'Remove Subject' button
        if (button.classList.contains('remove-subject')) {
            button.closest('.subject-entry').remove();
        }
        
        // Handle 'Remove Class' button
        if (button.classList.contains('remove-class')) {
            button.closest('.class-entry').remove();
        }
        
        // Handle 'Remove Teacher' button
        if (button.classList.contains('remove-teacher')) {
            button.closest('.teacher-entry').remove();
        }
    });

    // Form submission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Show loading indicator
        const submitButton = form.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.innerHTML = '<div class="loader-inline"></div> Generating...';
            submitButton.disabled = true;
        }
        
        // Add a loading animation to the results area
        if (resultsContainer) {
            resultsContainer.innerHTML = '<div class="loader"></div><p class="text-center">Generating your timetables...</p>';
        }
        
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
                const consecutiveHours = isLab ? parseInt(subjectEntry.querySelector('.consecutive-hours').value) : 1;

                if (subjectName && hours) {
                    if (isLab) {
                        subjects[subjectName] = {
                            hours: hours,
                            consecutive: consecutiveHours
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

            if (!response.ok) {
                throw new Error(data.error || 'Failed to generate timetable');
            }

            // Store timetable data in localStorage
            localStorage.setItem('timetableData', JSON.stringify(data));
            
            displayTimetables(data);
            showExportBar();
            
            // Re-enable submit button and restore original text
            if (submitButton) {
                submitButton.innerHTML = '<span class="material-symbols-outlined">auto_awesome</span> Generate Timetable';
                submitButton.disabled = false;
            }
        } catch (error) {
            console.error('Error:', error);
            
            // Determine the error message to display
            let errorMessage = 'An unexpected error occurred. Please try again.';
            
            if (error.message.includes('Failed to fetch')) {
                errorMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
            } else if (error.message.includes('Failed to generate')) {
                errorMessage = 'Unable to generate timetable with the provided inputs. Please check your class and teacher assignments and try again.';
            } else if (error.message) {
                errorMessage = error.message;
            }

            // Display the error message with animation
            resultsContainer.innerHTML = `
                <div class="error-message">
                    <span class="material-symbols-outlined">error</span>
                    <p>${errorMessage}</p>
                </div>`;
            
            // Re-enable submit button and restore original text
            if (submitButton) {
                submitButton.innerHTML = '<span class="material-symbols-outlined">auto_awesome</span> Generate Timetable';
                submitButton.disabled = false;
            }

            // Scroll the error message into view
            resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    });

    // Check for saved timetable data on page load
    if (resultsContainer) {
        const savedTimetableData = localStorage.getItem('timetableData');
        if (savedTimetableData) {
            try {
                const data = JSON.parse(savedTimetableData);
                displayTimetables(data);
                showExportBar();
            } catch (error) {
                console.error('Error loading saved timetable:', error);
            }
        }
    }

    // Display timetables
    function displayTimetables(data) {
        if (!resultsContainer) return;
        
        resultsContainer.innerHTML = '';
        
        // Add a clear button at the top
        const clearButton = document.createElement('button');
        clearButton.className = 'secondary-button';
        clearButton.innerHTML = '<span class="material-symbols-outlined">delete</span> Clear Results';
        clearButton.addEventListener('click', function() {
            localStorage.removeItem('timetableData');
            resultsContainer.innerHTML = '';
            document.querySelector('.export-bar')?.classList.remove('show');
        });
        
        const clearButtonContainer = document.createElement('div');
        clearButtonContainer.className = 'form-actions';
        clearButtonContainer.appendChild(clearButton);
        resultsContainer.appendChild(clearButtonContainer);

        // Create a container for all timetables
        const timetablesContainer = document.createElement('div');
        timetablesContainer.className = 'timetable-grid';
        resultsContainer.appendChild(timetablesContainer);

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
            
            // Add teacher assignments
            if (data[className].teacher_assignments) {
                const teacherAssignments = document.createElement('div');
                teacherAssignments.className = 'teacher-assignments';
                teacherAssignments.innerHTML = '<h3>Teacher Assignments</h3>';
                
                const assignmentsList = document.createElement('ul');
                
                for (const subject in data[className].teacher_assignments) {
                    const teacher = data[className].teacher_assignments[subject];
                    const listItem = document.createElement('li');
                    listItem.innerHTML = `<strong>${subject}:</strong> ${teacher}`;
                    assignmentsList.appendChild(listItem);
                }
                
                teacherAssignments.appendChild(assignmentsList);
                classDiv.appendChild(teacherAssignments);
            }
            
            timetablesContainer.appendChild(classDiv);
        }
    }

    // Export Handlers
    document.getElementById('export-pdf')?.addEventListener('click', () => {
        const timetableGrid = document.querySelector('.timetable-grid');
        if (!timetableGrid) {
            alert('No timetable to export!');
            return;
        }
        
        // Show loading indicator
        const exportBtn = document.getElementById('export-pdf');
        const originalText = exportBtn.innerHTML;
        exportBtn.innerHTML = '<span class="material-symbols-outlined">hourglass_top</span> Exporting...';
        exportBtn.disabled = true;
        
        // Use html2canvas to capture the timetable
        html2canvas(timetableGrid, {
            scale: 2, // Higher quality
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
        }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            
            // Create PDF with proper sizing
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            });
            
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
            
            const imgX = (pdfWidth - imgWidth * ratio) / 2;
            const imgY = 20;
            
            pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
            pdf.save('timetable.pdf');
            
            // Restore button
            exportBtn.innerHTML = originalText;
            exportBtn.disabled = false;
        }).catch(error => {
            console.error('Error exporting PDF:', error);
            alert('Error exporting PDF: ' + error.message);
            
            // Restore button
            exportBtn.innerHTML = originalText;
            exportBtn.disabled = false;
        });
    });

    document.getElementById('export-csv')?.addEventListener('click', () => {
        const timetableData = localStorage.getItem('timetableData');
        if (!timetableData) {
            alert('No timetable to export!');
            return;
        }
        
        try {
            const data = JSON.parse(timetableData);
            let csvContent = '';
            
            // Process each class timetable
            for (const className in data) {
                csvContent += `Class: ${className}\n`;
                
                // Add the table data
                data[className].table.forEach(row => {
                    csvContent += row.join(',') + '\n';
                });
                
                // Add teacher assignments
                if (data[className].teacher_assignments) {
                    csvContent += '\nTeacher Assignments:\n';
                    csvContent += 'Subject,Teacher\n';
                    
                    for (const subject in data[className].teacher_assignments) {
                        const teacher = data[className].teacher_assignments[subject];
                        csvContent += `${subject},${teacher}\n`;
                    }
                }
                
                csvContent += '\n\n'; // Add space between classes
            }
            
            // Create and download CSV file
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            
            link.setAttribute('href', url);
            link.setAttribute('download', 'timetable.csv');
            link.style.visibility = 'hidden';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Error exporting CSV:', error);
            alert('Error exporting CSV: ' + error.message);
        }
    });

    document.getElementById('export-print')?.addEventListener('click', () => {
        const timetableGrid = document.querySelector('.timetable-grid');
        if (!timetableGrid) {
            alert('No timetable to print!');
            return;
        }
        
        // Create a new window for printing
        const printWindow = window.open('', '_blank');
        
        // Add content to the print window
        printWindow.document.write(`
            <html>
            <head>
                <title>Timetable - Print</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    .class-timetable { margin-bottom: 30px; page-break-after: always; }
                    h2 { color: #4361ee; margin-bottom: 15px; }
                    h3 { color: #7209b7; margin-top: 20px; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
                    th { background-color: #f2f2f2; }
                    ul { padding-left: 20px; }
                    li { margin-bottom: 5px; }
                    @media print {
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="no-print" style="margin-bottom: 20px;">
                    <button onclick="window.print()">Print</button>
                    <button onclick="window.close()">Close</button>
                </div>
                ${timetableGrid.outerHTML}
            </body>
            </html>
        `);
        
        printWindow.document.close();
    });

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
    
    // Handle "Get Started" button click
    if (getStartedBtn) {
        getStartedBtn.addEventListener('click', function(e) {
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

    // Template functionality
    const saveTemplateBtn = document.getElementById('save-template');
    const templateNameInput = document.getElementById('template-name');
    
    if (saveTemplateBtn) {
        saveTemplateBtn.addEventListener('click', async function() {
            const templateName = templateNameInput.value.trim();
            if (!templateName) {
                alert('Please enter a template name');
                return;
            }
            
            // Collect form data
            const formData = {
                periods_per_day: parseInt(document.getElementById('periods-per-day').value),
                days: Array.from(document.querySelectorAll('.day-checkbox input:checked')).map(cb => cb.value),
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
                    const consecutiveHours = isLab ? parseInt(subjectEntry.querySelector('.consecutive-hours').value) : 1;
                    
                    if (subjectName && hours) {
                        if (isLab) {
                            subjects[subjectName] = {
                                hours: hours,
                                consecutive: consecutiveHours
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
                const response = await fetch('/save_template', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        name: templateName,
                        data: formData
                    })
                });
                
                if (!response.ok) {
                    throw new Error('Failed to save template');
                }
                
                alert('Template saved successfully!');
                templateNameInput.value = '';
                
                // Refresh template list if on templates page
                if (window.location.pathname.includes('/templates')) {
                    window.location.reload();
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error saving template: ' + error.message);
            }
        });
    }
    
    // Load template functionality
    document.querySelectorAll('.load-template-btn').forEach(btn => {
        btn.addEventListener('click', async function() {
            const templateName = this.dataset.template;
            
            try {
                const response = await fetch(`/load_template/${templateName}`);
                
                if (!response.ok) {
                    throw new Error('Failed to load template');
                }
                
                const template = await response.json();
                
                // Store the template data in localStorage
                localStorage.setItem('loadedTemplate', JSON.stringify(template));
                
                // Redirect to generator page
                window.location.href = '/generator';
            } catch (error) {
                console.error('Error:', error);
                alert('Error loading template: ' + error.message);
            }
        });
    });
    
    // Apply loaded template if available
    document.addEventListener('DOMContentLoaded', function() {
        const loadedTemplate = localStorage.getItem('loadedTemplate');
        
        if (loadedTemplate && window.location.pathname.includes('/generator')) {
            try {
                const template = JSON.parse(loadedTemplate);
                
                // Clear existing entries
                document.querySelectorAll('.class-entry').forEach(entry => entry.remove());
                document.querySelectorAll('.teacher-entry').forEach(entry => entry.remove());
                
                // Set periods per day
                if (template.periods_per_day) {
                    document.getElementById('periods-per-day').value = template.periods_per_day;
                }
                
                // Set days
                document.querySelectorAll('.day-checkbox input').forEach(checkbox => {
                    checkbox.checked = template.days.includes(checkbox.value);
                });
                
                // Add classes and subjects
                for (const className in template.class_subjects) {
                    // Click the add class button
                    document.querySelector('.add-class').click();
                    
                    // Get the last added class entry
                    const classEntry = document.querySelector('.class-entry:last-child');
                    
                    // Set class name
                    classEntry.querySelector('.class-name').value = className;
                    
                    // Remove the default subject entry
                    classEntry.querySelectorAll('.subject-entry').forEach((entry, index) => {
                        if (index > 0) entry.remove();
                    });
                    
                    // Add subjects
                    let firstSubject = true;
                    for (const subjectName in template.class_subjects[className]) {
                        const subjectData = template.class_subjects[className][subjectName];
                        
                        if (!firstSubject) {
                            // Click the add subject button for this class
                            classEntry.querySelector('.add-subject').click();
                        }
                        
                        // Get the last added subject entry for this class
                        const subjectEntry = classEntry.querySelector('.subject-entry:last-child');
                        
                        // Set subject name
                        subjectEntry.querySelector('.subject-name').value = subjectName;
                        
                        // Set hours and lab status
                        if (typeof subjectData === 'object') {
                            subjectEntry.querySelector('.subject-hours').value = subjectData.hours;
                            subjectEntry.querySelector('.is-lab').checked = true;
                            
                            // Show and set consecutive hours
                            const consecutiveInput = subjectEntry.querySelector('.consecutive-hours');
                            consecutiveInput.style.display = 'block';
                            consecutiveInput.value = subjectData.consecutive;
                        } else {
                            subjectEntry.querySelector('.subject-hours').value = subjectData;
                            subjectEntry.querySelector('.is-lab').checked = false;
                        }
                        
                        firstSubject = false;
                    }
                }
                
                // Add teachers
                for (const teacherName in template.teachers) {
                    // Click the add teacher button
                    document.querySelector('.add-teacher').click();
                    
                    // Get the last added teacher entry
                    const teacherEntry = document.querySelector('.teacher-entry:last-child');
                    
                    // Set teacher name and subjects
                    teacherEntry.querySelector('.teacher-name').value = teacherName;
                    teacherEntry.querySelector('.teacher-subjects').value = template.teachers[teacherName].join(', ');
                }
                
                // Clear the loaded template from localStorage
                localStorage.removeItem('loadedTemplate');
                
                alert('Template loaded successfully!');
            } catch (error) {
                console.error('Error applying template:', error);
                alert('Error applying template: ' + error.message);
            }
        }
    });

    // Delete template functionality
    document.querySelectorAll('.delete-template-btn').forEach(btn => {
        btn.addEventListener('click', async function() {
            if (!confirm('Are you sure you want to delete this template?')) {
                return;
            }
            
            const templateName = this.dataset.template;
            
            try {
                const response = await fetch(`/delete_template/${templateName}`, {
                    method: 'DELETE'
                });
                
                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.error || 'Failed to delete template');
                }
                
                // Remove the template card from the UI
                this.closest('.template-card').remove();
                
                // If no templates left, reload the page to show empty state
                if (document.querySelectorAll('.template-card').length === 0) {
                    window.location.reload();
                }
                
                alert('Template deleted successfully!');
            } catch (error) {
                console.error('Error:', error);
                alert('Error deleting template: ' + error.message);
            }
        });
    });
});