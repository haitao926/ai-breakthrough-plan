document.addEventListener('DOMContentLoaded', () => {

    const reportTypeSelect = document.getElementById('reportType');
    const formSections = document.querySelectorAll('.form-section');
    const saveBtn = document.getElementById('saveBtn');
    const previewBtn = document.getElementById('previewBtn');
    const modal = document.getElementById('previewModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const cancelSubmitBtn = document.getElementById('cancelSubmitBtn');
    const confirmSubmitBtn = document.getElementById('confirmSubmitBtn');
    const reportPreview = document.getElementById('reportPreview');
    const submitStatus = document.getElementById('submitStatus');

    const ALL_FIELDS = document.querySelectorAll('[data-field]');
    const LOCAL_STORAGE_KEY = 'projectManagementData';

    // --- Core Functions ---

    function switchForm(reportType) {
        formSections.forEach(section => {
            if (section.id === reportType) {
                section.classList.add('active');
            } else {
                section.classList.remove('active');
            }
        });
    }

    function saveState() {
        const data = {};
        ALL_FIELDS.forEach(field => {
            data[field.dataset.field] = field.value;
        });
        data.selectedReportType = reportTypeSelect.value;
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
        alert('进度已保存到浏览器本地！');
    }

    function loadState() {
        const data = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY));
        if (data) {
            ALL_FIELDS.forEach(field => {
                if (data[field.dataset.field]) {
                    field.value = data[field.dataset.field];
                }
            });
            if (data.selectedReportType) {
                reportTypeSelect.value = data.selectedReportType;
            }
        }
        switchForm(reportTypeSelect.value);
    }

    function generateReportHTML() {
        const data = {};
        ALL_FIELDS.forEach(field => {
            data[field.dataset.field] = field.value || 'N/A';
        });
        const type = reportTypeSelect.value;
        let html = `<h1>${reportTypeSelect.options[reportTypeSelect.selectedIndex].text}</h1>`;
        html += `<p><strong>项目名称:</strong> ${data.projectName}</p>`;
        
        const formatText = (text) => text.replace(/\n/g, '<br>');

        if (type === 'kickoff') {
            html += `<h2>项目详情</h2>
                     <p><strong>团队成员:</strong><br>${formatText(data.teamMembers)}</p>
                     <p><strong>项目背景与问题:</strong><br>${formatText(data.kickoff_background)}</p>
                     <p><strong>项目目标:</strong><br>${formatText(data.kickoff_goals)}</p>
                     <p><strong>关键创新点:</strong><br>${formatText(data.kickoff_innovations)}</p>
                     <p><strong>技术路线:</strong><br>${formatText(data.kickoff_tech_roadmap)}</p>`;
        } else if (type === 'midterm') {
            html += `<h2>中期进展</h2>
                     <p><strong>整体进度概述:</strong><br>${formatText(data.midterm_progress_summary)}</p>
                     <p><strong>演示链接:</strong> <a href="${data.midterm_demo_link}" target="_blank">${data.midterm_demo_link}</a></p>
                     <p><strong>问题与挑战:</strong><br>${formatText(data.midterm_challenges)}</p>
                     <p><strong>后续计划调整:</strong><br>${formatText(data.midterm_plan_adjustments)}</p>`;
        } else if (type === 'final') {
             html += `<h2>结项总结</h2>
                     <p><strong>目标完成情况:</strong><br>${formatText(data.final_goals_completion)}</p>
                     <p><strong>最终成果链接:</strong><br>${formatText(data.final_deliverables_links)}</p>
                     <p><strong>技术实现总结:</strong><br>${formatText(data.final_tech_summary)}</p>
                     <p><strong>反思与展望:</strong><br>${formatText(data.final_reflection)}</p>`;
        }
        return html;
    }
    
    function getFormDataAsJSON() {
        const data = {};
        document.querySelectorAll(`#${reportTypeSelect.value} [data-field]`).forEach(field => {
            data[field.dataset.field] = field.value;
        });
        
        return {
            reportType: reportTypeSelect.value,
            submittedAt: new Date().toISOString(),
            reportData: data
        };
    }

    async function submitReport() {
        const reportPayload = getFormDataAsJSON();
        
        if (!reportPayload.reportData.projectName) {
            alert('项目名称为必填项！');
            return;
        }

        submitStatus.textContent = '提交中...';
        confirmSubmitBtn.disabled = true;

        try {
            const response = await fetch('/api/submit-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reportPayload)
            });

            if (response.ok) {
                submitStatus.textContent = '提交成功!';
                alert('报告提交成功！');
                localStorage.removeItem(LOCAL_STORAGE_KEY); // Clear local storage on successful submission
                setTimeout(() => modal.classList.add('hidden'), 1000);
            } else {
                const errorData = await response.json();
                submitStatus.textContent = `提交失败: ${errorData.message}`;
                alert(`提交失败: ${errorData.message}`);
            }
        } catch (error) {
            submitStatus.textContent = '提交失败，网络错误。';
            alert('提交失败，请检查网络连接或联系管理员。');
            console.error('Submission error:', error);
        } finally {
            confirmSubmitBtn.disabled = false;
        }
    }


    // --- Event Listeners ---

    reportTypeSelect.addEventListener('change', (e) => switchForm(e.target.value));

    saveBtn.addEventListener('click', saveState);
    
    previewBtn.addEventListener('click', () => {
        reportPreview.innerHTML = generateReportHTML();
        submitStatus.textContent = '';
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    });

    closeModalBtn.addEventListener('click', () => modal.classList.add('hidden'));
    cancelSubmitBtn.addEventListener('click', () => modal.classList.add('hidden'));
    confirmSubmitBtn.addEventListener('click', submitReport);

    // --- Initialization ---
    loadState();
});
