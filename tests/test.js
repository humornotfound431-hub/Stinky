try {
    const args = process.argv;
    const {TEST_FUNCS} = await import(`${args[2]}`);

    if (TEST_FUNCS[args[3]]) {
        const output = await TEST_FUNCS[args[3]](...args.slice(4));
        console.log("OUTPUT:", output);
    }
}
catch (err) {
    console.error(err.message);
    process.exit(1);
}

//EXAMPLE: node ./tests/test.js ../log.js log Prince 12 chess command