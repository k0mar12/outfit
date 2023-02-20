import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  externals: [
    'h3',
    'socket.io-client'
  ]
})
