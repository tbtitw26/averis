import * as React from "react";
import Input, { InputProps } from "@mui/joy/Input";
import Select from "@mui/joy/Select";
import Option from "@mui/joy/Option";
import { useField } from "formik";

type SelectOption = {
    value: string;
    label: string;
};

type FormikInputProps = InputProps & {
    name: string;
    formik?: boolean;
    type?: string;
    options?: SelectOption[];
};

const InputUI: React.FC<FormikInputProps> = ({ formik, type, options, ...props }) => {
    if (formik && props.name) {
        const [field, meta, helpers] = useField(props.name);

        if (type === "select") {
            return (
                <>
                    <Select
                        name={field.name}
                        value={field.value || null}
                        placeholder={props.placeholder}
                        onBlur={() => helpers.setTouched(true)}
                        onChange={(_, value) => helpers.setValue(value || "")}
                        color={meta.error && meta.touched ? "danger" : "neutral"}
                    >
                        {options?.map((option) => (
                            <Option key={option.value} value={option.value}>
                                {option.label}
                            </Option>
                        ))}
                    </Select>
                    {meta.touched && meta.error && (
                        <div style={{ color: "red", fontSize: 12 }}>{meta.error}</div>
                    )}
                </>
            );
        }

        return (
            <>
                <Input
                    {...field}
                    {...props}
                    type={type}
                    value={field.value ?? ""}
                    error={!!meta.error && meta.touched}
                />
                {meta.touched && meta.error && (
                    <div style={{ color: "red", fontSize: 12 }}>{meta.error}</div>
                )}
            </>
        );
    }
    return <Input {...props} type={type} />;
};

export default InputUI;
