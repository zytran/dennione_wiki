(function () {
  const root = document.getElementById('infobox-editor');

  if (!root) {
    return;
  }

  const form = root.closest('form');
  const imageInput = document.getElementById('infobox-image');
  const sectionsEl = document.getElementById('infobox-sections');
  const addSectionBtn = document.getElementById('infobox-add-section');
  const dataInput = document.getElementById('infobox-data');

  let initial = { image: '', sections: [] };

  try {
    initial = JSON.parse(document.getElementById('infobox-initial').textContent);
  } catch (err) {
    initial = { image: '', sections: [] };
  }

  function el(tag, className, attrs) {
    const node = document.createElement(tag);

    if (className) {
      node.className = className;
    }

    if (attrs) {
      Object.keys(attrs).forEach(key => node.setAttribute(key, attrs[key]));
    }

    return node;
  }

  function removeButton(label) {
    const btn = el('button', 'infobox-icon-btn', {
      type: 'button',
      'aria-label': label,
      title: label,
    });
    btn.textContent = '\u00d7';
    return btn;
  }

  function autoGrow(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }

  function addRow(rowsEl, row) {
    const wrap = el('div', 'infobox-edit-row');

    const label = el('input', 'infobox-edit-label', {
      type: 'text',
      placeholder: 'Label (e.g. Name)',
      maxlength: '100',
      'aria-label': 'Row label',
    });


    const value = el('textarea', 'infobox-edit-value', {
      placeholder: 'Value',
      maxlength: '500',
      rows: '1',
      'aria-label': 'Row value',
    });

    label.value = row && row.label ? row.label : '';
    value.value = row && row.value ? row.value : '';
    value.addEventListener('input', () => autoGrow(value));

    const remove = removeButton('Remove row');
    remove.addEventListener('click', () => wrap.remove());

    wrap.append(label, value, remove);
    rowsEl.appendChild(wrap);

    
    autoGrow(value);

    return wrap;
  }

  function addSection(section) {
    const wrap = el('div', 'infobox-edit-section');
    const header = el('div', 'infobox-edit-section-header');

    const title = el('input', 'infobox-edit-title', {
      type: 'text',
      placeholder: 'Category title (e.g. Player Information)',
      maxlength: '100',
      'aria-label': 'Category title',
    });
    title.value = section && section.title ? section.title : '';

    const removeSection = removeButton('Remove category');
    removeSection.addEventListener('click', () => wrap.remove());

    header.append(title, removeSection);

    const rowsEl = el('div', 'infobox-edit-rows');

    const addRowBtn = el('button', 'infobox-add-row', { type: 'button' });
    addRowBtn.textContent = '+ Add row';
    addRowBtn.addEventListener('click', () => {
      addRow(rowsEl).querySelector('input').focus();
    });

    wrap.append(header, rowsEl, addRowBtn);
    sectionsEl.appendChild(wrap);

    const rows = section && section.rows && section.rows.length ? section.rows : [null];
    rows.forEach(row => addRow(rowsEl, row));

    return wrap;
  }

  (initial.sections || []).forEach(addSection);

  addSectionBtn.addEventListener('click', () => {
    addSection(null).querySelector('.infobox-edit-title').focus();
  });

  
  root.addEventListener('keydown', event => {
    if (event.key === 'Enter' && event.target.tagName === 'INPUT') {
      event.preventDefault();
    }
  });

  function collect() {
    const sections = Array.from(sectionsEl.querySelectorAll('.infobox-edit-section')).map(section => ({
      title: section.querySelector('.infobox-edit-title').value.trim(),
      rows: Array.from(section.querySelectorAll('.infobox-edit-row')).map(row => ({
        label: row.querySelector('.infobox-edit-label').value.trim(),
        value: row.querySelector('.infobox-edit-value').value.replace(/\r\n?/g, '\n').trim(),
      })),
    }));

    return { image: imageInput.value.trim(), sections };
  }

  form.addEventListener('submit', () => {
    dataInput.value = JSON.stringify(collect());
  });
})();
