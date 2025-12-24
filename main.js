        const { jsPDF } = window.jspdf;

        let totalSeconds = 60 * 60;
        let timerInterval;
        let currentPage = 1;
        let currentStudentName = '';
        let currentStudentId = '';
        let examStartTime = null;

        // ============================================================
        // AUTHENTICATION
        // ============================================================
        function checkStudent(event) {
            event.preventDefault();
            
            const name = document.getElementById('studentName').value.trim();
            const id = document.getElementById('studentId').value.trim();
            const errorMessage = document.getElementById('loginError');

            // Check if student exists in the list
            const student = registeredStudents.find(s => 
                s.name.toLowerCase() === name.toLowerCase() && 
                s.id.toLowerCase() === id.toLowerCase()
            );

            if (student) {
                // Student found - proceed to welcome page
                currentStudentName = student.name;
                currentStudentId = student.id;
                
                document.getElementById('displayName').textContent = student.name;
                document.getElementById('displayId').textContent = student.id;
                document.getElementById('displayDate').textContent = new Date().toLocaleString();
                
                errorMessage.classList.remove('show');
                showPage('welcomePage');
            } else {
                // Student not found - show error
                errorMessage.classList.add('show');
                document.getElementById('studentName').value = '';
                document.getElementById('studentId').value = '';
                document.getElementById('studentName').focus();
            }
        }

        // ============================================================
        // PAGE MANAGEMENT
        // ============================================================
        function showPage(pageId) {
            document.querySelectorAll('.page').forEach(page => {
                page.classList.remove('active');
            });
            document.getElementById(pageId).classList.add('active');
            window.scrollTo(0, 0);
        }

        function toggleCheckbox() {
            const checkbox = document.getElementById('agreeCheckbox');
            checkbox.checked = !checkbox.checked;
            updateStartButton();
        }

        function updateStartButton() {
            const checkbox = document.getElementById('agreeCheckbox');
            const startButton = document.getElementById('startButton');
            startButton.disabled = !checkbox.checked;
        }

        document.getElementById('agreeCheckbox').addEventListener('change', updateStartButton);

        function startExamination() {
            examStartTime = new Date();
            showPage('examPage');
            startTimer();
        }

        // ============================================================
        // TASK PAGE NAVIGATION
        // ============================================================
        function goToPage(pageNum) {
            document.querySelectorAll('.task-page').forEach(page => {
                page.classList.remove('active');
            });

            document.getElementById('page' + pageNum).classList.add('active');
            currentPage = pageNum;

            document.querySelectorAll('.progress-step').forEach((step, index) => {
                step.classList.remove('active');
                if (index + 1 === pageNum) {
                    step.classList.add('active');
                }
            });

            updateProgressSteps();
            window.scrollTo(0, 0);
        }

        // ============================================================
        // TIMER FUNCTIONALITY
        // ============================================================
        function startTimer() {
            timerInterval = setInterval(() => {
                totalSeconds--;
                updateTimerDisplay();

                if (totalSeconds <= 0) {
                    clearInterval(timerInterval);
                    autoSubmit();
                } else if (totalSeconds === 300) {
                    alert('⚠️ 5 minutes remaining!');
                } else if (totalSeconds === 60) {
                    alert('⚠️ 1 minute remaining!');
                }
            }, 1000);
        }

        function updateTimerDisplay() {
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;
            const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            document.getElementById('timerDisplay').textContent = display;

            const timerElement = document.getElementById('timerDisplay');
            if (totalSeconds <= 300) {
                timerElement.style.color = '#f44336';
            } else if (totalSeconds <= 600) {
                timerElement.style.color = '#ff9800';
            }
        }

        // ============================================================
        // WORD AND CHARACTER COUNTING
        // ============================================================
        function countWords(text) {
            text = text.trim();
            if (text === '') return 0;
            return text.split(/\s+/).length;
        }

        function updateWordCount(textareaId, countId, summaryId, min, max) {
            const textarea = document.getElementById(textareaId);
            const text = textarea.value;
            const wordCount = countWords(text);
            const charCount = text.length;

            const wordCountElement = document.getElementById(countId);
            const charCountElement = document.getElementById(countId.replace('WordCount', 'CharCount'));
            const summaryElement = document.getElementById(summaryId);

            wordCountElement.textContent = `${wordCount} words (Target: ${min}${max ? '-' + max : '+'})`;
            charCountElement.textContent = `${charCount} characters`;
            summaryElement.textContent = wordCount;

            wordCountElement.classList.remove('warning', 'error', 'success');
            if (wordCount < min * 0.8) {
                wordCountElement.classList.add('error');
            } else if (wordCount < min || (max && wordCount > max)) {
                wordCountElement.classList.add('warning');
            } else {
                wordCountElement.classList.add('success');
            }

            updateProgressSteps();
        }

        function updateProgressSteps() {
            const task1_1Words = countWords(document.getElementById('task1_1').value);
            const task1_2Words = countWords(document.getElementById('task1_2').value);
            const task2Words = countWords(document.getElementById('task2').value);

            const step1 = document.getElementById('step1');
            const step2 = document.getElementById('step2');
            const step3 = document.getElementById('step3');

            if (task1_1Words >= 40 && task1_1Words <= 60) {
                step1.classList.add('completed');
            } else {
                step1.classList.remove('completed');
            }

            if (task1_2Words >= 120 && task1_2Words <= 150) {
                step2.classList.add('completed');
            } else {
                step2.classList.remove('completed');
            }

            if (task2Words >= 180 && task2Words <= 200) {
                step3.classList.add('completed');
            } else {
                step3.classList.remove('completed');
            }
        }

        // ============================================================
        // PDF GENERATION
        // ============================================================
        function generatePDF(isFinal = false) {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            const margin = 20;
            const maxWidth = pageWidth - (2 * margin);
            let yPos = 20;

            // Title
            doc.setFontSize(18);
            doc.setFont(undefined, 'bold');
            const title = isFinal ? 'WRITING EXAMINATION - FINAL SUBMISSION' : 'WRITING EXAMINATION - PROGRESS SAVE';
            doc.text(title, pageWidth / 2, yPos, { align: 'center' });
            yPos += 15;

            // Student Info
            doc.setFontSize(11);
            doc.setFont(undefined, 'normal');
            doc.text(`Student: ${currentStudentName}`, margin, yPos);
            yPos += 7;
            doc.text(`Student ID: ${currentStudentId}`, margin, yPos);
            yPos += 7;
            doc.text(`Date: ${new Date().toLocaleString()}`, margin, yPos);
            yPos += 7;
            
            const timeUsed = isFinal ? (60 * 60 - totalSeconds) : 0;
            const minutes = Math.floor(timeUsed / 60);
            const seconds = timeUsed % 60;
            
            if (isFinal) {
                doc.text(`Time Used: ${minutes} minutes ${seconds} seconds`, margin, yPos);
            } else {
                doc.text(`Time Remaining: ${Math.floor(totalSeconds / 60)} minutes`, margin, yPos);
            }
            yPos += 15;

            // Task 1.1
            const task1_1 = document.getElementById('task1_1').value;
            const task1_1Words = countWords(task1_1);
            
            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.text('TASK 1.1: Email to a Friend', margin, yPos);
            yPos += 7;
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            doc.text(`Word Count: ${task1_1Words} words (Target: ~50 words)`, margin, yPos);
            yPos += 10;

            if (task1_1.trim()) {
                const lines1_1 = doc.splitTextToSize(task1_1, maxWidth);
                lines1_1.forEach(line => {
                    if (yPos > 270) {
                        doc.addPage();
                        yPos = 20;
                    }
                    doc.text(line, margin, yPos);
                    yPos += 7;
                });
            } else {
                doc.setFont(undefined, 'italic');
                doc.text('[No content yet]', margin, yPos);
                doc.setFont(undefined, 'normal');
                yPos += 7;
            }
            yPos += 10;

            // Task 1.2
            const task1_2 = document.getElementById('task1_2').value;
            const task1_2Words = countWords(task1_2);
            
            if (yPos > 250) {
                doc.addPage();
                yPos = 20;
            }

            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.text('TASK 1.2: Email to the Club President', margin, yPos);
            yPos += 7;
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            doc.text(`Word Count: ${task1_2Words} words (Target: 120-150 words)`, margin, yPos);
            yPos += 10;

            if (task1_2.trim()) {
                const lines1_2 = doc.splitTextToSize(task1_2, maxWidth);
                lines1_2.forEach(line => {
                    if (yPos > 270) {
                        doc.addPage();
                        yPos = 20;
                    }
                    doc.text(line, margin, yPos);
                    yPos += 7;
                });
            } else {
                doc.setFont(undefined, 'italic');
                doc.text('[No content yet]', margin, yPos);
                doc.setFont(undefined, 'normal');
                yPos += 7;
            }
            yPos += 10;

            // Task 2
            const task2 = document.getElementById('task2').value;
            const task2Words = countWords(task2);
            
            if (yPos > 250) {
                doc.addPage();
                yPos = 20;
            }

            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.text('TASK 2: Online Discussion Post', margin, yPos);
            yPos += 7;
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            doc.text(`Word Count: ${task2Words} words (Target: 180-200 words)`, margin, yPos);
            yPos += 10;

            if (task2.trim()) {
                const lines2 = doc.splitTextToSize(task2, maxWidth);
                lines2.forEach(line => {
                    if (yPos > 270) {
                        doc.addPage();
                        yPos = 20;
                    }
                    doc.text(line, margin, yPos);
                    yPos += 7;
                });
            } else {
                doc.setFont(undefined, 'italic');
                doc.text('[No content yet]', margin, yPos);
                doc.setFont(undefined, 'normal');
                yPos += 7;
            }

            if (isFinal) {
                doc.addPage();
                yPos = 20;
                doc.setFontSize(14);
                doc.setFont(undefined, 'bold');
                doc.text('SUMMARY', margin, yPos);
                yPos += 10;
                doc.setFontSize(10);
                doc.setFont(undefined, 'normal');
                doc.text(`Total Words: ${task1_1Words + task1_2Words + task2Words} words`, margin, yPos);
                yPos += 7;
                doc.text(`Time Used: ${minutes} minutes ${seconds} seconds`, margin, yPos);
            }

            const filename = isFinal 
                ? `${currentStudentId}_${currentStudentName.replace(/\s+/g, '_')}_FINAL_${new Date().getTime()}.pdf`
                : `${currentStudentId}_${currentStudentName.replace(/\s+/g, '_')}_Progress_${new Date().getTime()}.pdf`;
            
            doc.save(filename);
        }

        function downloadWork() {
            generatePDF(false);
            
            const indicator = document.getElementById('savedIndicator');
            indicator.classList.add('show');
            setTimeout(() => {
                indicator.classList.remove('show');
            }, 2000);
        }

        // ============================================================
        // SUBMISSION MODAL
        // ============================================================
        function showSubmissionModal() {
            const task1_1Words = countWords(document.getElementById('task1_1').value);
            const task1_2Words = countWords(document.getElementById('task1_2').value);
            const task2Words = countWords(document.getElementById('task2').value);

            let warnings = [];
            let canSubmit = true;

            if (task1_1Words === 0) {
                warnings.push('Task 1.1 is empty');
                canSubmit = false;
            } else if (task1_1Words < 40 || task1_1Words > 60) {
                warnings.push(`Task 1.1: ${task1_1Words} words (recommended: ~50 words)`);
            }

            if (task1_2Words === 0) {
                warnings.push('Task 1.2 is empty');
                canSubmit = false;
            } else if (task1_2Words < 100 || task1_2Words > 170) {
                warnings.push(`Task 1.2: ${task1_2Words} words (recommended: 120-150 words)`);
            }

            if (task2Words === 0) {
                warnings.push('Task 2 is empty');
                canSubmit = false;
            } else if (task2Words < 160 || task2Words > 220) {
                warnings.push(`Task 2: ${task2Words} words (recommended: 180-200 words)`);
            }

            let modalHTML = '';

            if (!canSubmit) {
                modalHTML += `
                    <div class="warning-message">
                        <strong>⚠️ Cannot Submit:</strong>
                        <ul style="margin-top: 10px; margin-left: 20px;">
                            ${warnings.map(w => `<li>${w}</li>`).join('')}
                        </ul>
                    </div>
                `;
            } else if (warnings.length > 0) {
                modalHTML += `
                    <div class="warning-message">
                        <strong>⚠️ Warnings:</strong>
                        <ul style="margin-top: 10px; margin-left: 20px;">
                            ${warnings.map(w => `<li>${w}</li>`).join('')}
                        </ul>
                        <p style="margin-top: 10px;"><strong>You can still submit, but consider reviewing these tasks.</strong></p>
                    </div>
                `;
            } else {
                modalHTML += `
                    <div class="success-message">
                        <strong>✓ All tasks meet the requirements!</strong>
                    </div>
                `;
            }

            modalHTML += `
                <div class="submission-summary">
                    <div class="summary-item">
                        <span class="summary-label">Student Name</span>
                        <span class="summary-value">${currentStudentName}</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Student ID</span>
                        <span class="summary-value">${currentStudentId}</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Task 1.1 (Email to Friend)</span>
                        <span class="summary-value">${task1_1Words} words</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Task 1.2 (Email to President)</span>
                        <span class="summary-value">${task1_2Words} words</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Task 2 (Discussion Post)</span>
                        <span class="summary-value">${task2Words} words</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Total Words</span>
                        <span class="summary-value">${task1_1Words + task1_2Words + task2Words} words</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Time Remaining</span>
                        <span class="summary-value">${Math.floor(totalSeconds / 60)} minutes</span>
                    </div>
                </div>
                
                <div class="success-message">
                    <h3 style="margin-bottom: 10px;">📄 PDF Submission</h3>
                    <p>Your submission will be automatically downloaded as a PDF file.</p>
                </div>
            `;

            document.getElementById('modalContent').innerHTML = modalHTML;
            
            const submitButton = document.querySelector('.modal-actions .btn-primary');
            if (!canSubmit) {
                submitButton.disabled = true;
                submitButton.style.opacity = '0.5';
                submitButton.style.cursor = 'not-allowed';
            } else {
                submitButton.disabled = false;
                submitButton.style.opacity = '1';
                submitButton.style.cursor = 'pointer';
            }

            document.getElementById('submissionModal').classList.add('active');
        }

        function closeSubmissionModal() {
            document.getElementById('submissionModal').classList.remove('active');
        }

        function finalSubmit() {
            clearInterval(timerInterval);
            
            generatePDF(true);

            alert('✅ Your examination has been submitted successfully!\n\nYour work has been downloaded as a PDF file.\n\nPlease save this file and submit it to your instructor.');
            
            document.querySelectorAll('textarea').forEach(ta => ta.disabled = true);
            document.querySelectorAll('.btn').forEach(btn => btn.disabled = true);
            
            closeSubmissionModal();
        }

        function autoSubmit() {
            alert('⏰ Time is up! Your examination will be automatically submitted.');
            showSubmissionModal();
            setTimeout(() => {
                if (!document.getElementById('submissionModal').classList.contains('active')) {
                    return;
                }
                const submitButton = document.querySelector('.modal-actions .btn-primary');
                if (!submitButton.disabled) {
                    finalSubmit();
                }
            }, 1000);
        }

        // ============================================================
        // EVENT LISTENERS
        // ============================================================
        document.getElementById('task1_1').addEventListener('input', () => {
            updateWordCount('task1_1', 'task1_1WordCount', 'task1_1Count', 50, null);
        });

        document.getElementById('task1_2').addEventListener('input', () => {
            updateWordCount('task1_2', 'task1_2WordCount', 'task1_2Count', 120, 150);
        });

        document.getElementById('task2').addEventListener('input', () => {
            updateWordCount('task2', 'task2WordCount', 'task2Count', 180, 200);
        });

        window.addEventListener('beforeunload', (e) => {
            if (document.getElementById('examPage').classList.contains('active')) {
                const task1_1 = document.getElementById('task1_1').value;
                const task1_2 = document.getElementById('task1_2').value;
                const task2 = document.getElementById('task2').value;
                
                if (task1_1 || task1_2 || task2) {
                    e.preventDefault();
                    e.returnValue = 'You have unsaved work. Use "Download Progress" to save your work before leaving.';
                    return e.returnValue;
                }
            }
        });

        // ============================================================
        // INITIALIZATION
        // ============================================================
        window.onload = function() {
            // Only initialize word counts when on exam page
            const examPage = document.getElementById('examPage');
            if (examPage && examPage.classList.contains('active')) {
                updateWordCount('task1_1', 'task1_1WordCount', 'task1_1Count', 50, null);
                updateWordCount('task1_2', 'task1_2WordCount', 'task1_2Count', 120, 150);
                updateWordCount('task2', 'task2WordCount', 'task2Count', 180, 200);
            }
        };