import ora from 'ora';
import chalk from 'chalk';
import Table from 'cli-table3';
import inquirer from 'inquirer';

import { downloadNovel, getHotList, getNovelDetails, search } from './downloader';

enum Questions {
    查看热门小说,
    搜索小说,
    下载小说,
    什么也不做,
}

export async function run(options: CommandOptions) {
    await init();

    async function init() {
        const questions = [
            {
                type: 'list',
                name: 'question',
                message: '你打算做什么',
                choices: [
                    Questions[Questions.查看热门小说],
                    Questions[Questions.搜索小说],
                    Questions[Questions.下载小说],
                    Questions[Questions.什么也不做],
                ],
            },
        ];
        inquirer.prompt(questions).then(async ({ question }) => {
            await questionTwo(question);
        });
    }

    async function questionTwo(question: keyof typeof Questions) {
        switch (question as keyof typeof Questions) {
            case Questions[Questions.查看热门小说]: {
                await promptForView();
                break;
            }

            case Questions[Questions.搜索小说]: {
                await promptForSearch();
                break;
            }

            case Questions[Questions.下载小说]: {
                await promptForDownload();
                break;
            }
            default: {
            }
        }

        async function promptForView() {
            const { type } = await inquirer.prompt([
                {
                    type: 'list',
                    name: 'type',
                    message: '请选择查询方式',
                    choices: [
                        '新番原作',
                        '新书风云榜',
                        '本周会员推荐',
                        new inquirer.Separator(),
                        '今日热榜',
                        '本月热榜',
                        '最受关注',
                        '已动画化',
                        '最新入库',
                        '返回',
                    ],
                    pageSize: 20,
                },
            ]);
            if (type === '返回') {
                await init();
            } else {
                const spinner = ora('请求中，请稍等...').start();
                const result = await getHotList();
                spinner.stop();

                const novels = result.find(({ type: t }) => t === type)!.novels;
                if ((await listNovels(novels, options)) === undefined) {
                    await questionTwo(question);
                }
            }
        }

        async function promptForSearch() {
            const { type, searchKey } = await inquirer.prompt([
                {
                    type: 'list',
                    name: 'type',
                    message: '请选择查询方式',
                    choices: [
                        { value: 'articlename', name: '根据小说名' },
                        { value: 'author', name: '根据作者名' },
                        '返回',
                    ],
                },
                {
                    type: 'input',
                    name: 'searchKey',
                    message: '请输入关键字',
                    when({ type }) {
                        return type !== '返回';
                    },
                },
            ]);
            if (type === '返回') {
                await init();
            } else if (searchKey) {
                if ((await doSearch(searchKey, type, options)) === undefined) {
                    await questionTwo(question);
                }
            }
        }

        async function promptForDownload() {
            const { urlOrId } = await inquirer.prompt([
                {
                    type: 'string',
                    name: 'urlOrId',
                    message: '请输入小说详情页链接，或者小说ID',
                    suffix: chalk.gray('（链接格式如下：www.wenku8.net/book/1973.htm）'),
                },
            ]);
            if ((await doFetch(urlOrId, options)) === undefined) {
                await questionTwo(question);
            }
        }
    }
}

export async function listNovels(
    novels: { novelName: string; novelId: number }[],
    options: CommandOptions
): Promise<number | undefined> {
    if (novels.length === 0) {
        return undefined;
    } else if (novels.length === 1) {
        const id = novels[0].novelId;
        await promptNovelDetails(id, options);
        return id;
    } else {
        const { id } = await inquirer.prompt([
            {
                type: 'list',
                name: 'id',
                message: '小说详情',
                choices: novels
                    .map(({ novelName, novelId }) => ({
                        value: novelId,
                        name: novelName,
                    }))
                    .concat([{ value: 0, name: '返回上一级' }]),
                pageSize: 20,
            },
        ]);
        if (id) {
            await promptNovelDetails(id, options);
            return id;
        } else {
            return undefined;
        }
    }
}

export async function promptNovelDetails(novelId: number, options: CommandOptions) {
    const spinner = ora('请求中，请稍等...').start();
    const { novelName, author, status, lastUpdateTime, length, tag, recentChapter, desc } = await getNovelDetails(
        novelId
    );
    spinner.stop();

    const table = new Table({
        head: ['小说名', '作者', '标签', '完结状态', '全文长度', '最近更新时间', '最近章节'],
        wordWrap: true,
        wrapOnWordBoundary: true,
    });
    table.push([novelName, author, tag, status, length, lastUpdateTime, recentChapter]);

    console.log(chalk.bold('小说信息：'));
    console.log(table.toString());
    console.log(chalk.bold('简介：'));
    console.log(desc);
    console.log();

    const { type } = await inquirer.prompt([
        {
            type: 'confirm',
            name: 'type',
            message: '是否下载该小说？',
        },
    ]);
    if (type) {
        downloadNovel(novelId, options);
    }
}

export async function doSearch(key: string, type: 'articlename' | 'author', options: CommandOptions) {
    const spinner = ora(`正在搜索${type === 'articlename' ? '标题为' : '作者为'}${key}的轻小说，请稍等...`).start();
    const novels = await search(key, type);
    spinner.stop();
    if (novels) {
        return await listNovels(novels, options);
    } else {
        console.log('未查询到符合的结果');
        return undefined;
    }
}

export async function doFetch(urlOrId: string, options: CommandOptions) {
    if (isFinite(Number(urlOrId))) {
        await promptNovelDetails(+urlOrId, options);
        return true;
    } else {
        const result = /wenku8\.net\/book\/(\d+)\.htm$/.exec(urlOrId);
        if (result?.[1]) {
            await promptNovelDetails(+result[1], options);
            return true;
        } else {
            console.log('参数异常');
            return undefined;
        }
    }
}
