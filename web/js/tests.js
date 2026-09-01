/**
 * Habitizer System Integration Test Streaming Client.
 * Single Responsibility: Connect to /api/run-tests via SSE and render live terminal progress.
 */
document.addEventListener('DOMContentLoaded', () => {
  if (window.Navbar) window.Navbar.render('tests');

  const runBtn = document.getElementById('run-btn');
  const runText = document.getElementById('run-text');
  const clearBtn = document.getElementById('clear-btn');
  const terminal = document.getElementById('terminal');
  const statusBadge = document.getElementById('status-badge');
  const timerDisplay = document.getElementById('timer-display');

  let timerInterval = null;
  let startTime = null;
  let eventSource = null;

  function resetSteps() {
    for (let i = 1; i <= 6; i++) {
      const step = document.getElementById(`step-${i}`);
      if (step) step.className = 'timeline-step';
    }
  }

  function setStepStatus(stepNum, status) {
    const step = document.getElementById(`step-${stepNum}`);
    if (step) step.className = `timeline-step ${status}`;
  }

  function startTimer() {
    startTime = Date.now();
    timerInterval = setInterval(() => {
      if (timerDisplay) timerDisplay.textContent = `${((Date.now() - startTime) / 1000).toFixed(1)}s`;
    }, 100);
  }

  function stopTimer() {
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
  }

  function appendTerminalLine(text, type = '') {
    if (!terminal) return;
    const line = document.createElement('div');
    line.className = `term-line ${type}`;
    const clean = text.replace(/\x1b\[[0-9;]*m/g, '');
    if (clean.includes('✓') || clean.includes('[PASS]')) line.classList.add('term-success');
    else if (clean.includes('ℹ') || clean.includes('[INFO]')) line.classList.add('term-info');
    else if (clean.includes('✗') || clean.includes('ERROR') || clean.includes('STDERR')) line.classList.add('term-error');
    else if (clean.includes('[') && clean.includes('/6]')) line.classList.add('term-stage-header');
    else if (clean.includes('===')) line.classList.add('term-divider');
    line.textContent = clean;
    terminal.appendChild(line);
    terminal.scrollTop = terminal.scrollHeight;
  }

  function runTests() {
    if (runBtn) runBtn.disabled = true;
    if (runText) runText.textContent = 'Running Tests...';
    if (statusBadge) { statusBadge.textContent = 'Running'; statusBadge.className = 'badge badge-running'; }

    resetSteps();
    startTimer();
    appendTerminalLine('Starting integration test execution...', 'term-info');

    if (eventSource) eventSource.close();
    eventSource = new EventSource('/api/run-tests');

    eventSource.onmessage = (event) => {
      const data = event.data;
      if (data.startsWith('[EXIT]')) {
        const exitCode = data.replace('[EXIT]', '').trim();
        stopTimer();
        if (runBtn) runBtn.disabled = false;
        if (runText) runText.textContent = 'Run Integration Tests';

        if (exitCode === '0') {
          if (statusBadge) { statusBadge.textContent = 'Passed (100%)'; statusBadge.className = 'badge badge-success'; }
          for (let i = 1; i <= 6; i++) setStepStatus(i, 'completed');
          if (window.Toast) window.Toast.show('All 6 Integration Test Stages Passed!', 'success');
        } else {
          if (statusBadge) { statusBadge.textContent = `Failed (Code ${exitCode})`; statusBadge.className = 'badge badge-error'; }
          if (window.Toast) window.Toast.show(`Test suite exited with code ${exitCode}`, 'error');
        }
        eventSource.close();
        eventSource = null;
        return;
      }

      if (data.includes('[1/6]')) setStepStatus(1, 'active');
      else if (data.includes('[2/6]')) { setStepStatus(1, 'completed'); setStepStatus(2, 'active'); }
      else if (data.includes('[3/6]')) { setStepStatus(2, 'completed'); setStepStatus(3, 'active'); }
      else if (data.includes('[4/6]')) { setStepStatus(3, 'completed'); setStepStatus(4, 'active'); }
      else if (data.includes('[5/6]')) { setStepStatus(4, 'completed'); setStepStatus(5, 'active'); }
      else if (data.includes('[6/6]')) { setStepStatus(5, 'completed'); setStepStatus(6, 'active'); }
      appendTerminalLine(data);
    };

    eventSource.onerror = () => {
      stopTimer();
      if (runBtn) runBtn.disabled = false;
      if (runText) runText.textContent = 'Run Integration Tests';
      if (eventSource) { eventSource.close(); eventSource = null; }
    };
  }

  if (runBtn) runBtn.addEventListener('click', runTests);
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (terminal) terminal.textContent = 'Terminal cleared. Ready for next test run.';
      resetSteps();
      if (statusBadge) { statusBadge.textContent = 'Idle'; statusBadge.className = 'badge badge-gray'; }
      if (timerDisplay) timerDisplay.textContent = '0.0s';
    });
  }
});
