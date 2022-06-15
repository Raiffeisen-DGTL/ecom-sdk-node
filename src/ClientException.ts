export default class ClientException {
    constructor(
      public readonly response: Response
    ) { }
}
