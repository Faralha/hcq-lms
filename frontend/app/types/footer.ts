export interface FooterItem {
    text: string
    type: 'link' | 'text'
    link?: string
}

export interface FooterSection {
    title: string
    items: FooterItem[]
}

export interface FooterConfig {
    logo: {
        image: string
        subtitle: string
        alt: string
    }
    sections: FooterSection[]
    copyright: string
}
