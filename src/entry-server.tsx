import { renderToString } from 'react-dom/server'
import { App } from './main'

export function render(route: string) {
  return renderToString(<App initialRoute={route} />)
}
