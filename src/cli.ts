import { breadc } from 'breadc';

import chalk from 'chalk';

import { version } from '../package.json';

import { getCookie } from './utils/fetch';
import { run } from './prompt';

const program = breadc('轻小说文库下载器', { version, description: '在终端实现轻小说的下载' })
    .option('--epub', '是否生成epub电子书 (默认：生成)', { default: true })
    .option('--ext <ext>', { description: '不生成epub电子书时，默认生成markdown文件', default: 'md' })
    .option('--onlyImages', '只下载小说的插图')
    .option('-o, --out-dir <dir>', { description: '指定小说放置目录，默认在当前目录下生成', default: './novels' })
    .option('--verbose', '显示更多日志')
    .option('--strict', '严格模式下图片的下载失败将会阻止epub文件的生成');

program.command('').action(async (options: CommandOptions) => {
    console.log(
        chalk.green(`欢迎使用轻小说文库下载器，本工具源码链接如下：https://github.com/Messiahhh/wenku8-downloader`)
    );
    await getCookie();
    run(options);
});

program.run(process.argv.slice(2)).catch(err => console.error(err));
