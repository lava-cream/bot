import { prop, SchemaTypes, CreateSubSchemaManager, SubSchema } from '#lib/database/structures/schema.js';
import type { OmitFunctions } from '#lib/utilities/common/index.js';

export class DonationDeskEntryQuestionSchema extends SubSchema {
  @prop({ type: String })
  public label!: string;

  @prop({ type: String })
  public value!: string;

  public constructor(options: OmitFunctions<DonationDeskEntryQuestionSchema>) {
    super(options.id);
    this.label = options.label;
    this.value = options.value;
  }

  public setLabel(label: string): this {
    this.label = label;
    return this;
  }

  public setValue(value: string): this {
    this.value = value;
    return this;
  }
}

export class DonationDeskEntryQuestionManagerSchema extends CreateSubSchemaManager(DonationDeskEntryQuestionSchema) {
  public get labels() {
    return this.entries.map(entry => entry.label);
  }
}

export class DonationDeskEntryRolesSchema {
  @prop({ type: SchemaTypes.Mixed })
  public access!: string | null;

  @prop({ type: SchemaTypes.Mixed })
  public staff!: string | null;

  public constructor(options: OmitFunctions<DonationDeskEntryRolesSchema>) {
    this.access = options.access;
    this.staff = options.staff;
  }

  public setAccess(access: string | null): this {
    this.access = access;
    return this;
  }

  public setStaff(staff: string | null): this {
    this.staff = staff;
    return this;
  }
}

export class DonationDeskEntryRequestDataSchema extends SubSchema {
  @prop({ type: String })
  public response!: string;

  public constructor(options: OmitFunctions<DonationDeskEntryRequestDataSchema>) {
    super(options.id);
    this.response = options.response;
  }

  public setResponse(response: string): this {
    this.response = response;
    return this;
  }
}

export class DonationDeskEntryRequestDataManagerSchema extends CreateSubSchemaManager(DonationDeskEntryRequestDataSchema) { }

export class DonationDeskEntryRequestSchema extends SubSchema {
  @prop({ type: String, immutable: true })
  public readonly message!: string;

  @prop({ type: () => DonationDeskEntryRequestDataManagerSchema, immutable: true })
  public readonly data!: DonationDeskEntryRequestDataManagerSchema;

  public constructor(options: OmitFunctions<Omit<DonationDeskEntryRequestSchema, 'data'>>) {
    super(options.id);
    this.message = options.message;
    this.data = new DonationDeskEntryRequestDataManagerSchema();
  }
}

export class DonationDeskEntryRequestManagerSchema extends CreateSubSchemaManager(DonationDeskEntryRequestSchema) { }

export class DonationDeskEntrySchema extends SubSchema {
  @prop({ type: String })
  public name!: string;

  @prop({ type: String })
  public description!: string;

  @prop({ type: () => DonationDeskEntryQuestionManagerSchema, immutable: true })
  public readonly questions!: DonationDeskEntryQuestionManagerSchema;

  @prop({ type: () => DonationDeskEntryRolesSchema, immutable: true })
  public readonly roles!: DonationDeskEntryRolesSchema;

  @prop({ type: () => DonationDeskEntryRequestManagerSchema, immutable: true })
  public readonly requests!: DonationDeskEntryRequestManagerSchema;

  public constructor(options: OmitFunctions<Pick<DonationDeskEntrySchema, 'id' | 'name' | 'description'>>) {
    super(options.id);
    this.name = options.name;
    this.description = options.description;
    this.questions = new DonationDeskEntryQuestionManagerSchema();
    this.roles = new DonationDeskEntryRolesSchema({ staff: null, access: null });
    this.requests = new DonationDeskEntryRequestManagerSchema();
  }

  public setName(name: string): this {
    this.name = name;
    return this;
  }

  public setDescription(description: string): this {
    this.description = description;
    return this;
  }
}

export class DonationDeskEntryManagerSchema extends CreateSubSchemaManager(DonationDeskEntrySchema) {
  public get names() {
    return this.entries.map(entry => entry.name);
  }
}