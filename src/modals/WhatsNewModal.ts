import { App, Modal } from 'obsidian';
import { strings } from '../i18n';
import { ReleaseNote } from '../releaseNotes';
import { DateUtils } from '../utils/dateUtils';

export class WhatsNewModal extends Modal {
    private releaseNotes: ReleaseNote[];
    private dateFormat: string;
    private thanksButton: HTMLButtonElement | null = null;

    constructor(app: App, releaseNotes: ReleaseNote[], dateFormat: string) {
        super(app);
        this.releaseNotes = releaseNotes;
        this.dateFormat = dateFormat;
    }

    onOpen(): void {
        const { contentEl } = this;

        contentEl.empty();
        contentEl.addClass('nn-whats-new-modal');

        contentEl.createEl('h2', {
            text: strings.whatsNew.title,
            cls: 'nn-whats-new-header'
        });

        const scrollContainer = contentEl.createDiv('nn-whats-new-scroll');

        this.releaseNotes.forEach(note => {
            const versionContainer = scrollContainer.createDiv('nn-whats-new-version');

            versionContainer.createEl('h3', {
                text: `Version ${note.version}`
            });

            // Parse the date string and format according to user preference
            const parsedDate = new Date(note.date);
            const formattedDate = DateUtils.formatDate(parsedDate.getTime(), this.dateFormat);

            versionContainer.createEl('small', {
                text: formattedDate,
                cls: 'nn-whats-new-date'
            });

            // Show info text first if present
            if (note.info) {
                versionContainer.createEl('p', {
                    text: note.info,
                    cls: 'nn-whats-new-info'
                });
            }

            const categories = [
                { key: 'new', label: 'New' },
                { key: 'improved', label: 'Improved' },
                { key: 'changed', label: 'Changed' },
                { key: 'fixed', label: 'Fixed' }
            ];

            categories.forEach(category => {
                const items = note[category.key as keyof ReleaseNote] as string[] | undefined;
                if (items && items.length > 0) {
                    // Create category header
                    versionContainer.createEl('h4', {
                        text: category.label,
                        cls: 'nn-whats-new-category'
                    });

                    // Create list for this category
                    const categoryList = versionContainer.createEl('ul', {
                        cls: 'nn-whats-new-features'
                    });

                    items.forEach(item => {
                        categoryList.createEl('li', { text: item });
                    });
                }
            });
        });

        // Add divider line right after scroll container
        contentEl.createDiv('nn-whats-new-divider');

        const supportContainer = contentEl.createDiv('nn-whats-new-support');

        supportContainer.createEl('p', {
            text: strings.whatsNew.supportMessage,
            cls: 'nn-whats-new-support-text'
        });

        const buttonContainer = contentEl.createDiv('nn-whats-new-buttons');

        // Create buttons directly without Setting wrapper
        const supportButton = buttonContainer.createEl('button', {
            text: strings.whatsNew.supportButton,
            cls: 'nn-support-button-small'
        });
        supportButton.addEventListener('click', () => {
            window.open('https://github.com/sponsors/johansan/');
        });

        const thanksButton = buttonContainer.createEl('button', {
            text: strings.whatsNew.thanksButton,
            cls: 'mod-cta'
        });
        thanksButton.addEventListener('click', () => {
            this.close();
        });

        // Store reference to thanks button
        this.thanksButton = thanksButton;
    }

    open(): void {
        super.open();
        // Focus the thanks button after the modal is fully opened
        if (this.thanksButton) {
            // Use requestAnimationFrame to ensure DOM is ready
            requestAnimationFrame(() => {
                this.thanksButton?.focus();
            });
        }
    }

    onClose(): void {
        const { contentEl } = this;
        contentEl.empty();
    }
}
