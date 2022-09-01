import config from '../../config.yaml'
import { useEffect, useState } from 'react'

const kvDataKey = 'monitors_data_v1_1'

export async function getKVMonitors() {
    // trying both to see performance difference
    return KV_STATUS_PAGE.get(kvDataKey, 'json')
    //return JSON.parse(await KV_STATUS_PAGE.get(kvDataKey, 'text'))
}

export async function setKVMonitors(data) {
    return setKV(kvDataKey, JSON.stringify(data))
}

const getOperationalLabel = (operational) => {
    return operational
        ? config.settings.monitorLabelOperational
        : config.settings.monitorLabelNotOperational
}

export async function setKV(key, value, metadata, expirationTtl) {
    return KV_STATUS_PAGE.put(key, value, { metadata, expirationTtl })
}

export async function notifyWebhook(monitor, operational) {
    const payload = {
        title: `${operational ? 'Monitor Online' : 'Monitor Offline'}`,
        body: monitor.name + ` ${operational ? 'is now Online.' : 'is now Offline.'}`,
        adaptors: {
            discord: {
                username: `${config.settings.title}`,
                avatar_url: `${config.settings.url}/${config.settings.logo}`,
                embeds: [
                    {
                        title: `${monitor.name} is ${getOperationalLabel(operational)} ${operational ? ':white_check_mark:' : ':x:'}`,
                        description: `\`${monitor.method ? monitor.method : 'GET'} ${monitor.url}\` - :eyes: [Status Page](${config.settings.url})`,
                        color: operational ? 3581519 : 13632027,
                    },
                ],
            },
        },
    }
    return fetch(SECRET_WEBHOOK_URL + `/status.${operational ? 'online' : 'offline'}`, {
        body: JSON.stringify(payload),
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': SECRET_WEBHOOK_TOKEN
        },
    })
}

export function useKeyPress(targetKey) {
    const [keyPressed, setKeyPressed] = useState(false)

    function downHandler({ key }) {
        if (key === targetKey) {
            setKeyPressed(true)
        }
    }

    const upHandler = ({ key }) => {
        if (key === targetKey) {
            setKeyPressed(false)
        }
    }

    useEffect(() => {
        window.addEventListener('keydown', downHandler)
        window.addEventListener('keyup', upHandler)

        return () => {
            window.removeEventListener('keydown', downHandler)
            window.removeEventListener('keyup', upHandler)
        }
    }, [])

    return keyPressed
}

export async function getCheckLocation() {
    const res = await fetch('https://cloudflare-dns.com/dns-query', {
        method: 'OPTIONS',
    })
    return res.headers.get('cf-ray').split('-')[1]
}
