@Library('devopslib@main') _

def map = [:]
    map.put('NodeVersion','node:20')
    map.put('CredentialsId', 'gitlab')
    map.put('BuildCmd','npm run build')
    map.put('BuildArtifactDir','dist')

nodes_server(map)
