import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const read = (path: string) => readFileSync(path, 'utf8')

test('iOS release configuration adopts the UIScene lifecycle', () => {
  const infoPlist = read('ios/App/App/Info.plist')
  const appDelegate = read('ios/App/App/AppDelegate.swift')
  const sceneDelegate = read('ios/App/App/SceneDelegate.swift')
  const project = read('ios/App/App.xcodeproj/project.pbxproj')

  assert.match(infoPlist, /<key>UIApplicationSceneManifest<\/key>/)
  assert.match(infoPlist, /<key>UISceneDelegateClassName<\/key>/)
  assert.match(infoPlist, /<string>\$\(PRODUCT_MODULE_NAME\)\.SceneDelegate<\/string>/)
  assert.match(infoPlist, /<key>UISceneStoryboardFile<\/key>\s*<string>Main<\/string>/)
  assert.match(appDelegate, /configurationForConnecting/)
  assert.match(sceneDelegate, /UIWindowSceneDelegate/)
  assert.match(sceneDelegate, /openURLContexts/)
  assert.match(sceneDelegate, /continue userActivity/)
  assert.match(sceneDelegate, /context\.options\.sourceApplication/)
  assert.match(sceneDelegate, /context\.options\.openInPlace/)
  assert.match(sceneDelegate, /context\.options\.annotation/)
  assert.match(project, /SceneDelegate\.swift in Sources/)
})
