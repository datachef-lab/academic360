// /* eslint-disable no-var */
// import { Connection } from "mysql2";

// declare global {
//     var mysql: {
//         connection: Connection | null;
//         isConnecting: Promise<Connection> | null;
//     };
// }






declare global {
    // eslint-disable-next-line no-var
    var mysql: DatabaseConnection | undefined;
}

export { };