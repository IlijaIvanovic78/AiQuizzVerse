import { clickSound, isTextField, keySound } from './ui-sounds.rules';

function find(html: string, selector: string): Element {
  const page = document.createElement('div');
  page.innerHTML = html;
  const element = page.querySelector(selector);
  if (!element) {
    throw new Error(`No ${selector} in ${html}`);
  }
  return element;
}

describe('clickSound', () => {
  it('plays select for the main buttons', () => {
    expect(clickSound(find('<button class="btn btn-primary">Play</button>', 'button'))).toBe(
      'select',
    );
    expect(clickSound(find('<button class="btn btn-success">Equip</button>', 'button'))).toBe(
      'select',
    );
    expect(clickSound(find('<a href="/library" class="btn btn-primary">Find</a>', 'a'))).toBe(
      'select',
    );
  });

  it('plays a low note for danger buttons', () => {
    expect(clickSound(find('<button class="btn btn-danger">Quit</button>', 'button'))).toBe(
      'danger',
    );
  });

  it('plays the menu blip for links and tabs', () => {
    expect(clickSound(find('<a href="/shop" class="nav-link">Shop</a>', 'a'))).toBe('menu');
    expect(clickSound(find('<button role="tab">Pets</button>', 'button'))).toBe('menu');
  });

  it('ticks for chips, switches, checkboxes and radios', () => {
    expect(
      clickSound(find('<button class="chip" aria-pressed="true">Science</button>', 'button')),
    ).toBe('toggle');
    expect(clickSound(find('<button aria-pressed="false">Sound</button>', 'button'))).toBe(
      'toggle',
    );
    expect(clickSound(find('<button role="switch">On</button>', 'button'))).toBe('toggle');
    expect(clickSound(find('<input type="checkbox" />', 'input'))).toBe('toggle');
    expect(clickSound(find('<input type="radio" />', 'input'))).toBe('toggle');
  });

  it('blips for any other button', () => {
    expect(clickSound(find('<button class="btn btn-ghost">Close</button>', 'button'))).toBe('blip');
  });

  it('hears a click on the text inside a button as a click on the button', () => {
    const html = '<button class="btn btn-primary"><span>Play</span></button>';

    expect(clickSound(find(html, 'span'))).toBe('select');
  });

  it('stays quiet for disabled controls', () => {
    expect(
      clickSound(find('<button class="btn btn-primary" disabled>Buy</button>', 'button')),
    ).toBeNull();
    expect(clickSound(find('<a href="/shop" aria-disabled="true">Shop</a>', 'a'))).toBeNull();
  });

  it('stays quiet inside controls that have a sound of their own', () => {
    const html =
      '<ol data-sound="none"><li><button class="answer"><span>A</span></button></li></ol>';

    expect(clickSound(find(html, 'button'))).toBeNull();
    expect(clickSound(find(html, 'span'))).toBeNull();
    expect(clickSound(find('<button data-sound="none">Open</button>', 'button'))).toBeNull();
  });

  it('stays quiet for anything that is not a control', () => {
    expect(clickSound(find('<p>Some text</p>', 'p'))).toBeNull();
    expect(clickSound(find('<a>No link</a>', 'a'))).toBeNull();
    expect(clickSound(find('<label>Name <input type="text" /></label>', 'input'))).toBeNull();
    expect(clickSound(document)).toBeNull();
    expect(clickSound(null)).toBeNull();
  });
});

describe('isTextField', () => {
  it('counts the fields people type into', () => {
    for (const type of ['text', 'email', 'search', 'number', 'password']) {
      expect(isTextField(find(`<input type="${type}" />`, 'input'))).toBe(true);
    }
    expect(isTextField(find('<input />', 'input'))).toBe(true);
    expect(isTextField(find('<textarea></textarea>', 'textarea'))).toBe(true);
  });

  it('leaves out every other field', () => {
    for (const type of ['checkbox', 'radio', 'range', 'color', 'file']) {
      expect(isTextField(find(`<input type="${type}" />`, 'input'))).toBe(false);
    }
    expect(isTextField(find('<select><option>EN</option></select>', 'select'))).toBe(false);
    expect(isTextField(find('<div contenteditable="true"></div>', 'div'))).toBe(false);
    expect(isTextField(null)).toBe(false);
  });
});

describe('keySound', () => {
  it('ticks lower when deleting', () => {
    expect(keySound(new InputEvent('input', { inputType: 'deleteContentBackward' }))).toBe(
      'delete',
    );
    expect(keySound(new InputEvent('input', { inputType: 'deleteWordBackward' }))).toBe('delete');
  });

  it('ticks normally for typing, pasting and any other input', () => {
    expect(keySound(new InputEvent('input', { inputType: 'insertText', data: 'a' }))).toBe('key');
    expect(keySound(new InputEvent('input', { inputType: 'insertFromPaste' }))).toBe('key');
    expect(keySound(new Event('input'))).toBe('key');
  });
});
