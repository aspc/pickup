import { isProfileExitClick } from './profileExitGuard'

const render = (html: string) => {
  document.body.innerHTML = html
  return document.body
}

describe('isProfileExitClick', () => {
  it('blocks navigation links and buttons', () => {
    const root = render(
      '<a href="/results" id="a">Results</a><button id="b">Menu</button>',
    )
    expect(isProfileExitClick(root.querySelector('#a'))).toBe(true)
    expect(isProfileExitClick(root.querySelector('#b'))).toBe(true)
  })

  it('lets the submit button through', () => {
    const root = render(
      '<form><button type="submit" id="s">Save</button></form>',
    )
    expect(isProfileExitClick(root.querySelector('#s'))).toBe(false)
  })

  it('lets form controls inside the profile form be used', () => {
    const root = render(`
      <form>
        <label class="cursor-pointer" id="label">
          <input type="checkbox" class="cursor-pointer" id="box" />
          <span id="text">Opt in to text messaging with ASPC</span>
        </label>
        <select id="school"></select>
      </form>`)
    expect(isProfileExitClick(root.querySelector('#box'))).toBe(false)
    expect(isProfileExitClick(root.querySelector('#text'))).toBe(false)
    expect(isProfileExitClick(root.querySelector('#school'))).toBe(false)
  })
})
