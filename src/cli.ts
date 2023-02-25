import { breadc } from 'breadc';

import chalk from 'chalk';

import { version } from '../package.json';

import type { CommandOptions } from './types';

import { getCookie } from './utils/fetch';

const program = breadc('wenku8', {
    version,
    description: '轻小说文库下载器 - 在终端实现轻小说的下载',
    plugins: [
        {
            async onPreRun() {
                await getCookie();
            },
        },
    ],
})
    .option('--epub', '是否生成epub电子书 (默认：生成)', { default: true })
    .option('--ext <ext>', { description: '不生成epub电子书时，默认生成markdown文件', default: 'md' })
    .option('--onlyImages', '只下载小说的插图')
    .option('-o, --out-dir <dir>', { description: '指定小说放置目录，默认在当前目录下生成', default: './novels' })
    .option('--verbose', '显示更多日志')
    .option('--strict', '严格模式下图片的下载失败将会阻止epub文件的生成');

program.command('', '开始交互式选择轻小说下载').action(async (options: CommandOptions) => {
    console.log(
        chalk.green(`欢迎使用轻小说文库下载器，本工具源码链接如下：https://github.com/Messiahhh/wenku8-downloader`)
    );
    const { run } = await import('./prompt');
    run(options);
});

program
    .command('search <name>', '搜索轻小说')
    .option('--key <type>', '搜索方式（可选：name / author）', { default: 'name' })
    .action(async (key, options) => {
        const { doSearch } = await import('./prompt');
        await doSearch(key, options.key === 'name' ? 'articlename' : 'author', options);
    });

program.command('fetch <url/id>', '使用小说详情页链接或 ID 进行下载').action(async (key, options) => {
    const { doFetch } = await import('./prompt');
    await doFetch(key, options);
});

program.run(process.argv.slice(2)).catch(err => console.error(err));
